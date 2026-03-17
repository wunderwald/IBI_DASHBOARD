//for OFFLINE version of dashboard (local data) (ibi_dashboard)
// Copy ecg, time and peak data from directories in ECG_TO_IBI and create registry

const fs = require('fs');
const parse = require('csv-parse/sync').parse;

const ibiDir = `../STREAMS_TO_IBI/ibiData`;
const streamsDir = `../RAW_TO_STREAMS/streams`;
const outputDir = "./dashboardInputData";

const existsAndIsFile = path => fs.existsSync(path) && fs.lstatSync(path).isFile();

// STEP 0: clear output dir
fs.readdirSync(outputDir)
    .filter(filename => fs.lstatSync(`${outputDir}/${filename}`).isFile())
    .filter(filename => filename.endsWith('.json'))
    .forEach(filename => fs.rmSync(`${outputDir}/${filename}`));

// STEP 1: for each ibi file, find ecg and time recording in streamsDir, 
//         ... then create a registry json: [ id, ibiPath, ecgPath, timePath ]
const isPeakFile = file => fs.lstatSync(`${ibiDir}/${file}`).isFile() && file.startsWith('peaks') && file.endsWith(".csv");
const peakFiles = fs.readdirSync(ibiDir).filter(isPeakFile);

const registry = peakFiles.map(peakFile => {
    //make and check ibi path
    const peakPath = `${ibiDir}/${peakFile}`;
    if( !existsAndIsFile(peakPath) ){
        throw `Peak file ${peakPath} does not exist at path.`;
    }

    //make ibi id
    const peakFileParts = peakFile.split('_');
    const peakId = peakFileParts.slice(1, peakFileParts.length - 1).join("_");

    //make & check ecg path
    const ecgFile = `${peakId}.csv`;
    const ecgPath = `${streamsDir}/${ecgFile}`;
    if( !existsAndIsFile(ecgPath) ){
        throw `Ecg file for ${peakFile} does not exist at path ${ecgPath}.`;
    }

    //make and check time path
    const timeFile = `${peakFileParts.slice(1, peakFileParts.length - 2).join("_")}_time.csv`;
    const timePath = `${streamsDir}/${timeFile}`;
    if( !existsAndIsFile(timePath) ){
        throw `Time file for ${peakFile} does not exist at path ${timePath}.`;
    }

    //return registry entry
    return {
        id: peakId,
        peakPath: peakPath,
        ecgPath: ecgPath,
        timePath: timePath,
    }
});

const DEFAULT_SAMPLING_RATE = 1000;
const samplingRateFromPath = path => {
    const matches = path.match(/_[0-9]+hz/g);
    if(!matches) return null;
    return +(matches[0].substring(1, matches[0].length-2));
}
const getSamplingRate = (ecgPath, peakPath) => {
    const srFromEcgPath = samplingRateFromPath(ecgPath);
    if(srFromEcgPath) return srFromEcgPath;
    const srFromPeakPath = samplingRateFromPath(peakPath);
    if(srFromPeakPath) return srFromPeakPath;
    return DEFAULT_SAMPLING_RATE;
};
const readCSV_1d = (path) => {
    const raw = fs.readFileSync(path);
    const records = parse(raw, {
        skip_empty_lines: true
    });
    //return records.reduce((arr, el) => [...arr, ...el], ([]));
    return records
}

console.log("\n# Converting files...\n")
registry
    .forEach(entry => {
        console.log(`➡️  ${entry.id}`);
        try{
            // STEP 2: parse data
            const ecgData = readCSV_1d(entry.ecgPath);
            const ecg = ecgData.map((sample, i) => ({ index: i, ecg: +sample[0] }));
            
            const peakData = readCSV_1d(entry.peakPath);
            const peaks = peakData.map(sample => +sample[0]);
            
            const startIndex = 0;
            const endIndex = ecg.length-1;

            const samplingRate = getSamplingRate(entry.ecgPath, entry.peakPath);
            const removedRegions = [];

            const data = {
                ecg, peaks,
                startIndex, endIndex,
                removedRegions,
                samplingRate
            };

            // STEP 3: write files to output dir
            const outputFilename = `${entry.id}.json`;
            const outputPath = `${outputDir}/${outputFilename}`;
            fs.writeFileSync(outputPath, JSON.stringify(data));

            console.log(`✅ written to ${outputPath} \n`);
        }catch (err) {
            console.log(`❌ Unexpected error... [${err.message}]\n`);
        }
    });



