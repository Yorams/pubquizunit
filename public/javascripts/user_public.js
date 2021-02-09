var baseUrl = window.location.href;
var glob_userList;

var userListTemplate = Handlebars.compile($('#userListTemplate').html());
Handlebars.registerHelper('isNotAdmin', function (role) {
    return role !== "admin";
});

getUserList()

$('.editUserModal').on('show.bs.modal', function (e) {
    // Clear errors
    $(".errorMsg").html("");
    $(".userInput").removeClass("is-valid")
    $(".userInput").removeClass("is-invalid")

    // Reset inputs
    $(".userInput[name='id']").val("")
    $(".userInput[name='username']").val("")
    $(".userInput[name='password']").val("")
    $(".userInput[name='passwordConfirm']").val("")

    // Get ID
    var id = $(e.relatedTarget).data('id');

    // Empty error message
    $(this).find(".errorMsg").html("");

    if (typeof (id) === "undefined") {
        // Create user
        $(this).find(".modal-title").html("Create User")
    } else {
        // Edit user
        $(this).find(".modal-title").html("Edit User")

        // Get user details
        var currentUser = glob_userList.find(function (obj) {
            return obj.id == id
        })
        $(".userInput[name='id']").val(currentUser.id)
        $(".userInput[name='username']").val(currentUser.username)
    }

    // Copy user id from delete button to "yes" button
    $(this).find('.btnDelUser').data('id', $(e.relatedTarget).data('id'));
});

$(".saveUserBtn").on("click", function () {
    var id = $(".userInput[name='id']").val()
    var username = $(".userInput[name='username']").val()
    var password = $(".userInput[name='password']").val()
    var passwordConfirm = $(".userInput[name='passwordConfirm']").val()

    // Check if password matches
    if (password === passwordConfirm) {
        // Passwords are matching.
        var sendData = {
            id: id,
            username: username,
            password: password
        }

        // Post to backend
        $.post("edit", sendData, function (responseData) {
            if (responseData.result == "success") {
                // Create user was is successfull
                getUserList();
                $(".userInput").addClass("is-valid")
                $(".editUserModal").modal("hide");

            } else if (responseData.result == "error") {
                // Create user failed
                if (responseData.errorCode == "username_taken") {
                    $(".userInput[name='username']").addClass("is-invalid")
                }
                $(".errorMsg").html(responseData.errorMsg)
            }
        })

    } else {
        // Passwords doesn't match
        $(".userInput[name='password']").addClass("is-invalid")
        $(".userInput[name='passwordConfirm']").addClass("is-invalid")
        $(".errorMsg").html("Passwords doesn't match")
    }
})

// Delete user btn
$('.confirmModal').on('show.bs.modal', function (e) {
    // Empty error message
    $(".confirmModal .errorMsg").html("");

    // Copy user id from delete button to "yes" button
    $(this).find('.btnDelUser').data('id', $(e.relatedTarget).data('id'));
});

// Confirm delete user
$(".btnDelUser").on("click", function () {
    var sendData = {
        id: $(this).data("id"),
    }

    // Post to backend
    $.post("delete", sendData, function (responseData) {
        if (responseData.result == "success") {
            // Delete was succesfull
            getUserList();
            $('.confirmModal').modal("hide");

        } else if (responseData.result == "error") {
            // Delete failed
            $(".confirmModal .errorMsg").html(responseData.errorMsg);
            console.log(responseData.errorMsg);

        }
    });
});

function getUserList () {
    $.post("list", function (responseData) {
        glob_userList = responseData.data;

        $(".userListMain").html(userListTemplate(responseData.data));
    })
}