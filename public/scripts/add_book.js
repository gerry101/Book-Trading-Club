$(function() {
    
    document.getElementById("file").onchange = function () {
    var reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById("image").src = e.target.result;
    }
    reader.readAsDataURL(this.files[0]);
    }
        
    $.validator.setDefaults ({
       
       highlight: function(element) {
            $(element)
                .closest(".md-form")
                .addClass("has-danger");
        },
       unhighlight: function(element) {
            $(element)
                .closest(".md-form")
                .removeClass("has-danger");
        },
       errorPlacement: function(error, element) {
           if(element.prop("type") === "password" || "text") {
               error.insertAfter(element.parent());
           }
       }
    }); 
    
    $("#add-book-form").validate({
      rules: {
          name: {
              required: true
          },
          link: {
              required: true
          }
      },
      messages: {
          name: {
              required: "Please provide your book's name"
          },
          link: {
              required: "Please provide a url to your book or to your portfolio"
          }
      }
   });
    
});