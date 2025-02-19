
const getBaseUrl = (req, imagePath) => {
    const protocol = req.protocol; 
    const host = req.get('host'); 
    const baseUrl = `${protocol}://${host}/`;
    return `${baseUrl}${imagePath}`;
  };
  
  module.exports = {
    getBaseUrl,
  };
  