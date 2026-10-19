// Local accounts are deliberately unavailable in a production build.
export function localMode(){return process.env.SPOLK_DATA_MODE==="local"&&process.env.NODE_ENV!=="production";}
