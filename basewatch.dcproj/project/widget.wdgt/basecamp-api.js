var BasecampAPI =
{
    login: function( url, token, callback )
    {
        this.userId = null;
        this.companies = null;
        
        this.url = url;
        this.token = token;
        
        this.refreshUserId( function( api, result ) {
            if ( result )
                api.refreshCompaniesAndProjects( function( api, result ) {
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
    
    refreshCompaniesAndProjects: function( callback )
    {
        var api = this;
        this.companies = {};
        var companiesURL = this.url+'/companies.xml';
        var xhr = new XMLHttpRequest();
        xhr.onload = function()
        {
            var responseXML = xhr.responseXML;
            for ( var childNodeIdx in responseXML.firstChild.childNodes )
            {
                var childNode = responseXML.firstChild.childNodes[childNodeIdx];
                if ( childNode.nodeName != 'company' )
                    continue;
                var id;
                var name;
                for ( var grandchildNodeIdx in childNode.childNodes )
                {
                    var grandchildNode = childNode.childNodes[grandchildNodeIdx];
                    if ( grandchildNode.nodeName == 'id' )
                        id = grandchildNode.firstChild.nodeValue;
                    else if ( grandchildNode.nodeName == 'name' )
                        name = grandchildNode.firstChild.nodeValue;
                }
                api.companies[id] = { id:id, name:name, projects:{} };
            }
            var projectsURL = api.url+'/projects.xml';
            var projectXHR = new XMLHttpRequest();
            projectXHR.onload = function()
            {
                var responseXML = projectXHR.responseXML;
                for ( var childNodeIdx in responseXML.firstChild.childNodes )
                {
                    var childNode = responseXML.firstChild.childNodes[childNodeIdx];
                    if ( childNode.nodeName != 'project' )
                        continue;
                    var id;
                    var name;
                    var active = false;
                    var companyId;
                    for ( var grandchildNodeIdx in childNode.childNodes )
                    {
                        var grandchildNode = childNode.childNodes[grandchildNodeIdx];
                        if ( grandchildNode.nodeName == 'id' )
                            id = grandchildNode.firstChild.nodeValue;
                        else if ( grandchildNode.nodeName == 'name' )
                            name = grandchildNode.firstChild.nodeValue;
                        else if ( grandchildNode.nodeName == 'status' )
                            active = grandchildNode.firstChild.nodeValue == "active";
                        else if ( grandchildNode.nodeName == 'company' )
                        {
                            for ( var grandgrandchildNodeIdx in grandchildNode.childNodes )
                            {
                                var grandgrandchildNode = grandchildNode.childNodes[grandgrandchildNodeIdx];
                                if ( grandgrandchildNode.nodeName == 'id' )
                                    companyId = grandgrandchildNode.firstChild.nodeValue;
                            }
                        }
                    }
                    if ( active )
                        api.companies[companyId].projects[id] = { id: id, name: name };
                }
                callback( api, true );
            };
            projectXHR.onerror = projectXHR.onabort = function( event )
            {
                callback( api, false );
            };
            projectXHR.open( 'GET', projectsURL, true, api.token, 'X' );
            projectXHR.setRequestHeader( "Cache-Control", "no-cache" );
            projectXHR.setRequestHeader( 'Accept', 'application/xml' );
            projectXHR.setRequestHeader( 'Content-Type', 'application/xml' );
            projectXHR.send(null);
        };
        xhr.onerror = xhr.onabort = function( event )
        {
            callback( api, false );
        };
        xhr.open( 'GET', companiesURL, true, this.token, 'X' );
        xhr.setRequestHeader( "Cache-Control", "no-cache" );
        xhr.setRequestHeader( 'Accept', 'application/xml' );
        xhr.setRequestHeader( 'Content-Type', 'application/xml' );
        xhr.send(null);
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
