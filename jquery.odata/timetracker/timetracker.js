/// <reference path="../script/jquery-1.4.2.js" />
/// <reference path="../script/jquery.odata.js" />
$(document).ready(function () {
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
        var tmp = {},
            item = $(this) // cb
                    .parent() // td
                    .parent() // tr
                    .data('entry');

        item.IsDone = this.checked;
        item.FinishedOn = new Date();
        delete item.Category;
        delete item.User;

        //  odata.update('Items(' + item.ItemId + ')', item, {
        //      etag: item.__metadata.etag,
        //      success: function (res) {
        //          item.__metadata.etag = res.etag;
        //          console.log(res);
        //      }
        //  });

        // partial update
        odata.update('Items(' + item.ItemId + ')', { IsDone: item.IsDone, FinishedOn: item.FinishedOn }, {
            etag: item.__metadata.etag,
            success: function (res) {                
                bindTable();                
            }
        });
    });

    $('#insert-save').click(function () {
        var item = {};
        item.UserId = $('#insert-user').val();
        item.CategoryId = $('#insert-category').val();
        item.Description = $('#insert-description').val();
        item.IsDone = $('#insert-isDone')[0].checked;
        item.CreatedOn = new Date();
        odata.create('Items', item, function (res) {
            //addContentToTable(res.data);            
            bindTable();
        });
    });

    bindTable = function () {
        odata.from("Items").orderby("IsDone,CreatedOn").expand("Category,User").query(function (res) {
            $('tbody#content').html('');
            addContentToTable(res.data);
        });
    };

    addContentToTable = function (data) {
        $('tbody#content').append('#content-tmpl', data, {
            rendering: function (context, dom) {
                context.dataItem.FinishedOn = context.dataItem.FinishedOn || null;
            },
            rendered: function (context, dom) {
                $(dom).data('entry', context.dataItem);
            }
        });
    };

    bindTable();
});