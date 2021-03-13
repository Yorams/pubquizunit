var glob_list;

var listTemplate = Handlebars.compile($('#listTemplate').html());


getList()



$("body").on("click", ".editItem", function (e) {

    // Clear errors
    $(".errorMsg").html("");
    $(".editInput").removeClass("is-valid")
    $(".editInput").removeClass("is-invalid")

    // Reset inputs
    $(".editInput[name='id']").val("")
    $(".editInput[name='name']").val("")
    $(".editInput[name='uuid']").val("")


    // Get ID
    var id = $(this).data('id');

    // Empty error message
    $(this).find(".errorMsg").html("");

    if (typeof (id) === "undefined") {
        // Create
        $(".editModal").find(".modal-title").html("Create Team")
    } else {
        // Edit
        $(".editModal").find(".modal-title").html("Edit Team")

        // Get details
        var currentItem = glob_list.find(function (obj) {
            return obj.id == id
        })

        $(".editInput[name='id']").val(currentItem.id)
        $(".editInput[name='name']").val(currentItem.name)
        $(".editInput[name='uuid']").val(currentItem.uuid)
    }

    // Copy id from delete button to "yes" button
    $(this).find('.btnDelItem').data('id', id);

    $(".editModal").modal("show")
});

$("body").on("click", ".noEdit", function (e) {
    e.stopPropagation();
});

$(".editForm").on("submit", function (e) {
    e.preventDefault();

    var id = $(".editInput[name='id']").val()
    var name = $(".editInput[name='name']").val()

    var sendData = {
        id: id,
        name: name,
    }

    // Post to backend
    sendPost("edit", sendData, function (responseData) {
        if (responseData.result == "success") {
            // Create was is successfull
            getList();
            $(".editInput").addClass("is-valid")
            $(".editModal").modal("hide");

        } else if (responseData.result == "error") {
            // Create failed
            if (responseData.errorCode == "name_taken") {
                $(".editInput[name='name']").addClass("is-invalid")
            }
            $(".errorMsg").html(responseData.errorMsg)
        }
    })

})

// Delete  btn
$(".listMain").on("click", ".btnDelItem", function (e) {
    e.stopPropagation();

    // Empty error message
    $(".confirmModal .errorMsg").html("");

    // Copy id from delete button to "yes" button
    $(".btnConfirmDelItem").attr('data-id', $(this).data('id'));

    $(".confirmModal").modal("show")
});

// Confirm delete 
$(".btnConfirmDelItem").on("click", function () {
    var sendData = {
        id: $(this).attr("data-id"),
    }

    // Post to backend
    sendPost("delete", sendData, function (responseData) {
        if (responseData.result == "success") {
            // Delete was succesfull
            getList();
            $('.confirmModal').modal("hide");

        } else if (responseData.result == "error") {
            // Delete failed
            $(".confirmModal .errorMsg").html(responseData.errorMsg);
            console.log(responseData.errorMsg);

        }
    });
});

function getList () {
    sendPost("list", function (responseData) {
        glob_list = responseData.data;

        $(".listMain").html(listTemplate({ listData: responseData.data, baseUrl: window.location.origin }));
    })
}