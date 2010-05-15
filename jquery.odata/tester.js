/// <reference path="script/jquery-1.4.2.js" />
$(document).ready(function () {

    var odata = $.odata("http://localhost:32751/services/AdventureWorks.svc/"),
        prods = odata.from("Products").select('ProductID,Name,ProductNumber,Color,StandardCost,ListPrice,Size,Weight,ThumbNailPhoto').top(10);
        //prods = odata.from("Products").select('ProductID,Name,ProductNumber,Color,StandardCost,ListPrice,Size,Weight,ThumbNailPhoto');

    prods.query(function (res) {
        var thead, tbody, obj, col, odd = false, tr, cols = [], data;
        $("table > caption").text(res.query.uri);

        data = res.version === "1.0" ? res.data : res.data.results;

        if (data.length > 0) {
            thead = $('table > thead > tr');
            obj = data[0];
            for (col in obj) {
                if (col !== undefined && col !== '__metadata') {
                    if (odd) {
                        thead.append($('<th />').attr('scope', 'col').addClass('th-odd').text(col));
                    } else {
                        thead.append($('<th />').attr('scope', 'col').addClass('th-even').text(col));
                    }
                    cols.push(col);
                    odd = !odd;
                }
            }

            tbody = $('table > tbody');
            for (var i = 0; i < data.length; i += 1) {
                odd = false;
                obj = data[i];
                tr = $('<tr />');

                for (var j = 0; j < cols.length; j += 1) {
                    if (odd) {
                        if (cols[j] === 'ThumbNailPhoto') {
                            tr.append($('<td />').addClass('vzebra-odd').append($('<img />').attr('src', odata.from('Products(' + obj['ProductID'] + ')/ThumbNailPhoto').value(false).uri)));
                        } else {
                            tr.append($('<td />').addClass('vzebra-odd').text(obj[cols[j]] === undefined ? '' : obj[cols[j]]));
                        }
                    } else {
                        if (cols[j] === 'ThumbNailPhoto') {
                            tr.append($('<td />').addClass('vzebra-even').append($('<img />').attr('src', odata.from('Products(' + obj['ProductID'] + ')/ThumbNailPhoto').value(false).uri)));
                        } else {
                            tr.append($('<td />').addClass('vzebra-even').text(obj[cols[j]] === undefined ? '' : obj[cols[j]]));
                        }
                    }
                    odd = !odd;
                }

                tbody.append(tr);
            }
        }
    });
});
