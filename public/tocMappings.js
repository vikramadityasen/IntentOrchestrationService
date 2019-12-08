var tocMappings = {
    getmapping(key){
        var mapping = {
            "DEFAULT_TOC":"default_toc.png",
            "CROSS_COUNTRY": "cross_country.jpg",
            "EAST_MIDLAND_TRAINS":"east_mids_logo.jpg",
            "ARRIVA_TRAINS_WALES":"arriva_wales_logo.jpg"
        }
        key = key.toUpperCase().replace(new RegExp(" ", 'g'), "_")
        return mapping[key];
    }

}
module.exports = tocMappings;
