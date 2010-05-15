/// <reference path="../script/jquery-1.4.2.js" />
/// <reference path="../script/jquery.odata-0.2.js" />
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
        var tmp,
            item = $(this) // cb
                    .parent() // td
                    .parent() // tr
                    .data('entry');

        item.IsDone = this.checked;
        item.FinishedOn = item.IsDone ? new Date() : null;
        tmp = { IsDone: item.IsDone, FinishedOn: item.FinishedOn };

        // partial update
        odata.update('Items(' + item.ItemId + ')', tmp, {
            etag: item.__metadata.etag,
            success: function (res) {
                bindTable();
            }
        });
    });

    $('tbody#content input[name=delete]').live('click', function () {
        var item = $(this) // cb
                    .parent() // td
                    .parent(), // tr
            entry = item.data('entry');

        odata.remove(entry, function(){
            item.remove();
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