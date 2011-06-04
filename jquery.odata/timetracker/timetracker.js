/// <reference path="../script/jquery-1.6.1.js" />
/// <reference path="../script/jquery.odata-0.2.js" />
/// <reference path="../script/jQuery.tmpl.js" />

$(document).ready(function () {

    // Setup global converter for dates
    // For an alternative approach see http://codepaste.net/i89xhc
    $.ajaxSetup({
        converters: { "text json": function (jsonString) {
            return JSON.parse(jsonString, function (key, value) {
                var dateTimeParts, date;
                if (value !== null) {
                    if (value.toString().indexOf('Date') !== -1) {
                        // "\/Date(<ticks>["+" | "-" <offset>)\/"
                        dateTimeParts = /^\/Date\((-?\d+)([\-|+]\d+)?\)\/$/.exec(value);
                        if (dateTimeParts) {
                            // consider doing something with the offset part.
                            date = new Date(parseInt(dateTimeParts[1], 10));
                            return date;
                        }
                    }
                    return value;
                }
            });


        }
        }
    });


    var odata = $.odata("/services/TimeTracker.svc"),
        bindTable,
        addContentToTable;

    odata.from("Users").orderby("Name").query(function (res) {
        var usersSelect = $('#insert-user');
        $.each(res.data, function (index, value) {
            usersSelect.append($('<option />').attr('value', value.Id).text(value.Name).data('entry', value));
        });
    });

    odata.from("Categories").orderby("Name").query(function (res) {
        var categorySelect = $('#insert-category');
        $.each(res.data, function (index, value) {
            categorySelect.append($('<option />').attr('value', value.Id).text(value.Name).data('entry', value));
        });
    });

    $('tbody#content input[type=checkbox]').live('click', function () {
        var item = $(this).tmplItem().data;
        item.IsDone = this.checked;
        item.FinishedOn = item.IsDone ? new Date() : null;

        var tmp = { IsDone: item.IsDone, FinishedOn: item.FinishedOn };

        // partial update
        odata.update('Items(' + item.ItemId + ')', tmp, {
            etag: item.__metadata.etag,
            complete: function (res) {
                bindTable();
            }
        });
    });

    $('tbody#content input[name=delete]').live('click', function () {
        var row = $(this) // cb
                    .parent() // td
                    .parent(); // tr
        
        var entry = $(this).tmplItem().data;

        odata.remove(entry, function () {
            row.remove();
        })
    });


    $('#insert-save').click(function () {
        var item = {};
        item.UserId = $('#insert-user').val();
        item.CategoryId = $('#insert-category').val();
        item.Description = $('#insert-description').val();
        item.IsDone = $('#insert-isDone')[0].checked;
        item.CreatedOn = new Date();
        item.FinishedOn = item.IsDone ? item.CreatedOn : null;
        odata.create('Items', item, function (res) {
            bindTable();
            $('#insert-description').val("");
        });
    });

    bindTable = function () {
        odata.from("Items").orderby("CreatedOn desc").expand("Category,User").query(function (res) {
            $('tbody#content').empty();
            $("#content-tmpl").tmpl(res.data).appendTo('tbody#content');
        });
    };

    //    addContentToTable = function (data) {
    //        $('tbody#content').append('#content-tmpl', data, {
    //            rendering: function (context, dom) {
    //                context.dataItem.FinishedOn = context.dataItem.FinishedOn || null;
    //            },
    //            rendered: function (context, dom) {
    //                $(dom).data('entry', context.dataItem);
    //            }
    //        });
    //    };

    bindTable();
});