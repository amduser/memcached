"use strict"

var Memcached = require('./memcached.js')
var sync = require('deasync')
var DEFAULT_TIMEOUT = 1000*60 // 60 seconds


class AutodiscoveryClient {
    
    constructor(servers, config, options, memcachedClust) {                
        if (servers === undefined)
            throw "Server cluster musn't be undefined";
            
        if (config === undefined)
            config = {}
            
        this.autodiscovery = config.autodiscovery || false
        this.update_time = config.update_time || DEFAULT_TIMEOUT
        this.cluster_version = 0
        this.options = options
        if (memcachedClust === undefined)
            this.memcached_cluster = new Memcached(servers, options)
        else
            this.memcached_cluster = memcachedClust;
        
        this.check_cluster()
        
        if (this.autodiscovery)
            setInterval(this.check_cluster.bind(this), this.update_time)
        
        while(this.memcached === undefined) {
            sync.runLoopOnce()
        }
    };
    
    touch (key, lifetime, callback) {
        this.memcached.touch(key, lifetime, callback) 
    };
    
    config (type, callback) {
        this.memcached_cluster.config(type, callback)
    };
    
    get (key, callback) {
        this.memcached.get(key, callback)
    };
    
    gets (key, callback) {
        this.memcached.gets(key, callback) 
    };
    
    getMulti (keys, callback) {
        this.memcached.getMulti(keys, callback) 
    };
    
    set (key, value, lifetime, callback) {
        this.memcached.set(key, value, lifetime, callback)
    };
    
    replace (key, value, lifetime, callback) {
        this.memcached.replace(key, value, lifetime, callback)
    };
    
    add (key, value, lifetime, callback) {
        this.memcached.add(key, value, lifetime, callback)
    };    
    
    cas (key, value, lifetime, cas, callback) {
        this.memcached.cas(key, value, lifetime, cas, callback)
    };   
    
    append (key, value, callback) {
        this.memcached.append(key, value, callback)
    };   
     
    prepend (key, value, callback) {
        this.memcached.prepend(key, value, callback)
    };         
    
    incr (key, amount, callback) {
        this.memcached.incr(key, amount, callback)
    };
    
    decr (key, amount, callback) {
        this.memcached.decr(key, amount, callback)
    };
    
    del (key, callback) {
        this.memcached.del(key, callback)
    };     
    
    version (callback) {
        this.memcached.version(callback)
    };
    
    flush (callback) {
        this.memcached.flush(callback)
    };
    
    stats (callback) {
        this.memcached.stats(callback)
    };
    
    settings (callback) {
        this.memcached.settings(callback)
    };
    
    slabs (callback) {
        this.memcached.slabs(callback)
    };
    
    items (callback) {
        this.memcached.items(callback)
    };
    
    cachedump (server, slabid, number, callback) {
        this.memcached.cachedump(server, slabid, number, callback)
    };
    
    end () {
        this.memcached.end()  
    };                 
           
    
    check_cluster() {
        this.memcached_cluster.config('cluster', (err, data) => {
            if (err) {
                err.message = `Config get cluster error`;
                console.log(err)
            } else {
                
                data = data.split('\n')
                var new_version = parseInt(data[0])
                var servers = []
                
                if (new_version !== this.cluster_version) {
                    console.log('Cluster version changed from ' + this.cluster_version 
                                + ' to ' + new_version + '. Reloading nodes..')
                    this.cluster_version = new_version
                    for (var i = 1; i < data.length; i++) {
                        var node = data[i]
                        if (node !== undefined && node !== ' ') {
                            node = node.split(' ');
                            for(var j = 0; j < node.length; j++) {
                                var info = node[j].split('|')
                                if (info.length === 3) {
                                    servers.push((info[1] + ':' + info[2]).trim())
                                }
                            }
                        }
                    }
                    this.memcached = new Memcached(servers, this.options)
                }
            }   
        });
    };
    
}

module.exports = AutodiscoveryClient