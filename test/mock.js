"use strict"

class Mock {
    constructor(servers) {
        this.setServers( [].concat(servers))
        this.version = 0
    }
    
    setServers(servers) {
        this.servers = [].concat(servers)
    }
    
    config (type, callback) {
        var response = ""
        
        this.version = this.version + 1
            
        response += this.version + ' \n';
        for(var i = 0; i < this.servers.length; i++) {
            var _serverport = this.servers[i].split(':')
            if (_serverport.length === 2)
                response += _serverport[0] + '|' + _serverport[0] + '|' + _serverport[1] + ' '
        }
        response += '\n\r\nEND\r\n'

        callback(undefined, response)
    }
    
}

module.exports = Mock