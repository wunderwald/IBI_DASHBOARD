import { schemeRdYlGn,  } from 'd3-scale-chromatic';

const makeD3Theme = arr => [[], ...arr.map((el, i) => [...arr].splice(0, i+1))];


const schemes = {
    redYellowGreen: schemeRdYlGn,
    //generated using https://learnui.design/tools/data-color-picker.html#divergent
    myBluePink: makeD3Theme(['#0cd8f7', '#64d6fd', '#8fd4fc', '#afd2f6', '#c5d2ed', '#abb8fd', '#a998ff', '#bd6cf9', '#db09de']),
};
const selectedScheme = schemes.redYellowGreen;

const getTheme = () => Object({
    visColor: '#aeeef8',
    visBackgroundColor: '#333',
    scheme: selectedScheme,
    resources: {
        brightYellow: '#ffff99',
        vxBarGroup: {
            blue: '#aeeef8',
            green: '#e5fd3d',
            purple: '#9caff6',
        }
    }
});

export default getTheme;
