export const padRange = (range, padding) => {
    const length = range[1] - range[0];
    return[range[0] - padding*length, range[1] + padding*length];
  }