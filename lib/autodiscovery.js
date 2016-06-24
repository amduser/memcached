var Memcached = require('./memcached.js');
var sync = require('deasync');
var DEFAULT_TIMEOUT = 1000*60; // 60 seconds


function AutodiscoveryClient(servers, config) {
    if (servers === undefined)
        throw "Server cluster musn't be undefined";
        
    if (config === undefined)
        config = {};
        
    this.autodiscovery = config.autodiscovery || false;
    this.update_time = config.update_time || DEFAULT_TIMEOUT;
    this.cluster_version = 0;
    this.memcached_cluster = new Memcached(servers);
    
    check_cluster();
    
    if (this.autodiscovery)
        setInterval(check_cluster.bind(this), this.update_time);
    
    while(this.memcached === undefined) {
        sync.runLoopOnce();
    }
    
    return this.memcached;
}


function check_cluster() {
    var that = this;
    this.memcached_cluster.config('cluster', function(err, data) {
        
        data = data.split('\n');
        var new_version = parseInt(data[0]);
        var servers = [];
        
        if (new_version !== that.cluster_version) {
            console.log('Cluster version changed from ' + that.cluster_version 
                        + ' to ' + new_version + '. Reloading nodes..');
            that.cluster_version = new_version;
            for (var i = 1; i < data.length; i++) {
                var node = data[i];
                if (node !== undefined && node !== ' ') {
                    var info = node.split('|');
                    if (info.length === 3) {
                        servers.push(info[1] + ':' + info[2]);
                    }
                }
            }
                    
            that.memcached = new Memcached(servers);
        }
    });
}

module.exports = AutodiscoveryClient;