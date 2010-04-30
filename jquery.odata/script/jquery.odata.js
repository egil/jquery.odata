/// <reference path="jquery-1.4.2.js" />
"use strict";
(function ($) {
    var trimSlashes,
        trimRightSlashes,
        trim,
        serviceCall,
        uriBuilder,
        odata,
        odataQuery;

    // use buildin String.trim function if one is available, otherwise use jQuery.trim.
    trim = typeof String.trim === 'function' ? String.trim : jQuery.trim;

    // trims slashes away from begining and end of string.
    trimSlashes = function (str) {
        return str.replace(/^\/+|\/+$/g, '');
    };
    // trims slashes away from the end of the string.
    trimRightSlashes = function (str) {
        return str.replace(/\/+$/g, '');
    };

    // HACK: remove before publish. Enables VS2010 jQuery intellisense in closure.
    $ = jQuery;

    odata = function (serviceRootURI, options) {
        ///	<summary>
        ///		Create a new OData object that can be used to query against
        ///     the specified service root URI.
        ///	</summary>
        ///	<returns type="odata" />
        ///	<param name="serviceRootURI" type="String">
        ///		The service root URI of a OData service.
        ///	</param>
        var that, settings;

        // extend settings with options.
        settings = jQuery.extend({
            protocol: 'json'
        }, options);

        // constructs the odata object and assign data to it
        that = {};

        // trim and remove slashes from end of serviceRootURI.
        that.serviceRootURI = trimRightSlashes(trim(serviceRootURI));
        that.settings = settings;

        that.from = function (resourcePath) {
            ///	<summary>
            ///		Create a new OData Query object that defines a new query
            ///     which can be used to query against the OData service root URI.
            ///	</summary>
            ///	<returns type="odataQuery" />
            ///	<param name="resourcePath" type="String">
            ///		The resource path to query on the OData service.
            ///	</param>    
            return odataQuery.apply($.extend({}, this), [resourcePath]);
        };

        return that;
    };

    odataQuery = function (resourcePath) {
        ///	<summary>
        ///		Create a new OData Query object that defines a new query
        ///     which can be used to query against the OData service root URI.
        ///	</summary>
        ///	<returns type="odataQuery" />
        ///	<param name="resourcePath" type="String">
        ///		The resource path to query on the OData service.
        ///	</param>    
        var that = this,
            value,
            count,
            query,
            params;

        params = function (params) {
            ///	<summary>
            ///		Assign Service Operations parameters to this OData Query object.
            ///	</summary>
            ///	<returns type="from" />
            ///	<param name="params" type="Object">
            ///		Argument must be in the form of an object.
            ///	</param>                
            var that;

            // create OData Query object
            that = $.extend({}, this);

            // add params to query options object
            that.options = $.extend(true, that.options, { params: params });

            return that;
        };


        count = function () {
            ///	<summary>
            ///		Retrives the number of entries associated resource path.
            ///	</summary>
            ///	<param name="completed" type="Function">
            ///		Function to call with the return value.
            ///	</param>        
            var that;

            // create new OData Query object
            that = $.extend({}, this);

            // add count query string to query options object
            that.options = $.extend({}, that.options, { count: '$count' });

            // execute the query
            query.apply(that);
        };

        value = function () {
            ///	<summary>
            ///		Retrives the "raw value" of the specified property
            ///	</summary>
            ///	<param name="completed" type="Function">
            ///		Function to call with the return value.
            ///	</param>
            var that;

            // create new OData Query object
            that = $.extend({}, this);

            // add value query string to query options object
            that.options = $.extend({}, that.options, { value: '$value' });

            // execute the query
            query.apply(that);
        };

        query = function (options) {
            ///	<summary>
            ///		Queries the OData service.
            ///	</summary>
            serviceCall(this, options);
        };

        // trim and remove both slashes from both start and end of resourcePath.
        that.resourcePath = trimSlashes(trim(resourcePath));

        // add options object
        that.options = {};

        // add methods
        that.value = value;
        that.count = count;
        that.query = query;
        that.params = params;

        return that;
    };
    
    uriBuilder = function (query) {
        var uri, p, pp;
        // base
        uri = query.serviceRootURI + '/' + query.resourcePath;

        // add count if specified
        if (query.options.count !== undefined) {
            uri += '/' + query.options.count;
            return uri;
        }

        // add count if specified
        if (query.options.value !== undefined) {
            uri += '/' + query.options.value;
            return uri;
        }

        // add service operations params
        if (query.options.params !== undefined) {
            pp = '';
            for (p in query.options.params) {
                // skip undefined entries
                if (p === undefined) continue;

                // todo: test how this handles different datatypes such as datetime
                // http://www.odata.org/developers/protocols/overview#AbstractTypeSystem
                if (typeof query.options.params[p] === 'string')
                    pp += p + "='" + query.options.params[p] + "'";
                else
                    pp += p + "=" + query.options.params[p];
            }
            if (pp.length > 0) {
                uri += '?' + pp;
            }
        }

        // specify ?$format=json in url if retriving json, 
        // i.e. not $count or $value.
        if (query.settings.protocol === 'jsonp') {
            uri += '?$format=json';
        }

        return uri;
    };

    serviceCall = function (query, options) {
        var opt = query.options,
            settings,
            uri;

        // extend settings with options.
        settings = jQuery.extend({
            protocol: query.settings.protocol
        }, options);

        // select dataType based on query
        if (settings.protocol !== 'jsonp') {
            if (opt.value !== undefined) {
                settings.protocol = '*/*';
            } else if (opt.count !== undefined) {
                settings.protocol = 'text';
            }
        }

        // todo: actually handle jsonp calls probably
        $.ajax({
            beforeSend: function (xhr) {
                // note: this function is not called when dataType = jsonp

                // Tell service we understand DataServiceVersion 2.0
                xhr.setRequestHeader('MaxDataServiceVersion', '2.0');

                // DataServiceVersion must be 2.0 if using
                // $count or $select query options
                if (opt.count === undefined && opt.select === undefined) {
                    xhr.setRequestHeader('DataServiceVersion', '1.0');
                }
                else {
                    xhr.setRequestHeader('DataServiceVersion', '2.0');
                }
            },
            dataFilter: function (data) {

            },
            dataType: settings.protocol,
            global: false,
            type: "GET",
            url: uriBuilder(query),
            success: function (data) {
                console.log(data);
            }
        });
    };

    $.odata = odata;
} (jQuery));