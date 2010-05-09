var BasecampAPI =
{
    login: function( url, token, callback )
    {
        this.userId = null;
        this.projects = null;
        
        this.url = url;
        this.token = token;
        
        this.refreshUserId( function( api, result ) {
            if ( result )
                api.refreshProjects( function( api, result ) {
                    callback( api, result );
                } );
            else
                callback( api, false );
        } );
    },
    
    ready: function() {
        return this.userId != null;
    },
    
    refreshUserId: function(callback)
    {
        var api = this;
        this.userId = null;
        var xhr = new XMLHttpRequest();
        xhr.onload = function()
        {
            var responseXML = xhr.responseXML;
            for ( var childNodeIdx in responseXML.firstChild.childNodes )
            {
                var childNode = responseXML.firstChild.childNodes[childNodeIdx];
                if ( childNode.nodeName == 'id' )
                    api.userId = childNode.firstChild.nodeValue;
            }
            callback( api, true );
        };
        xhr.onerror = xhr.onabort = function( event )
        {
            callback( api, false );
        };
        var userIdUrl = this.url+'/me.xml';
        xhr.open( 'GET', userIdUrl, true, this.token, 'X' );
        xhr.setRequestHeader( "Cache-Control", "no-cache" );
        xhr.setRequestHeader( 'Accept', 'application/xml' );
        xhr.setRequestHeader( 'Content-Type', 'application/xml' );
        xhr.send(null);
    },
    
    refreshProjects: function( callback )
    {
        var api = this;
        this.projects = {};
        var projectsURL = this.url+'/projects.xml';
        var xhr = new XMLHttpRequest();
        xhr.onload = function()
        {
            var responseXML = xhr.responseXML;
            for ( var childNodeIdx in responseXML.firstChild.childNodes )
            {
                var childNode = responseXML.firstChild.childNodes[childNodeIdx];
                if ( childNode.nodeName != 'project' )
                    continue;
                var id;
                var name;
                var active = false;
                for ( var grandchildNodeIdx in childNode.childNodes )
                {
                    var grandchildNode = childNode.childNodes[grandchildNodeIdx];
                    if ( grandchildNode.nodeName == 'id' )
                        id = grandchildNode.firstChild.nodeValue;
                    else if ( grandchildNode.nodeName == 'name' )
                        name = grandchildNode.firstChild.nodeValue;
                    else if ( grandchildNode.nodeName == 'status' )
                        active = grandchildNode.firstChild.nodeValue == "active";
                }
                if ( active )
                    api.projects[id] = { id: id, name: name };
            }
            callback( api, true );
        };
        xhr.onerror = xhr.onabort = function( event )
        {
            callback( api, false );
        };
        xhr.open( 'GET', projectsURL, true, this.token, 'X' );
        xhr.setRequestHeader( "Cache-Control", "no-cache" );
        xhr.setRequestHeader( 'Accept', 'application/xml' );
        xhr.setRequestHeader( 'Content-Type', 'application/xml' );
        xhr.send(null);
    },
    
    projectNameToId: function( name )
    {
        for ( var id in this.projects )
        {
            var project = this.projects[id];
            if ( project.name == name )
                return project.id;
        }
        return null;
    },

    submitTime: function( projectId, seconds, comment, callback )
    {
        var api = this;
        var xhr = new XMLHttpRequest();
        xhr.onload = function( result )
        {
            callback( api, xhr.status == 201 );
        };
        xhr.onerror = xhr.onabort = function( event )
        {
            callback( api, false );
        };
        xhr.open( 'POST', this.url+"/projects/"+projectId+"/time_entries.xml", true, this.token, 'X' );
        xhr.setRequestHeader( "Cache-Control", "no-cache" );
        xhr.setRequestHeader( 'Accept', 'application/xml' );
        xhr.setRequestHeader( 'Content-Type', 'application/xml' );
        var data = "<time-entry>\n";
        data += "  <person-id>"+this.userId+"</person-id>\n";
        data += "  <date>"+this.formatDate(new Date)+"</date>\n";
        data += "  <hours>"+Math.round(seconds/36)/100+"</hours>\n";
        data += "  <description>"+comment+"</description>\n";
        data += "</time-entry>\n";
        xhr.send(data);
    },
    
    formatDate: function( date )
    {
        result = "";
        result += date.getFullYear();
        result += "-";
        if ( date.getMonth() + 1 < 10 )
            result += "0";
        result += date.getMonth() + 1;
        result += "-";
        if ( date.getDate() < 10 )
            result += "0";
        result += date.getDate();
        return result;
    },
};
