$(function() {
   
      $('[data-toggle="tooltip"]').tooltip();
    
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

       $.validator.addMethod("strongPass", function(value, element) {
           return this.optional(element) || value.length >= 6;
       },
        "Your password has to be six characters long");    

       $("#register-form").validate({
          rules: {
              username: {
                  required: true
              },
              email: {
                  required: true,
                  email: true
              },
              password: {
                  required: true,
                  strongPass: true
              },
              confirm: {
                  required: true,
                  equalTo: "#password"
              }
          },
          messages: {
              username: {
                  required: "Please provide a username"
              },
              email: {
                  required: "Your email address is required"
              },
              password: {
                  required: "A password is required"
              },
              confirm: {
                  required: "Please confirm your password",
                  equalTo: "Your passwords have to match"
              }
          }

       }); 
    
        $("#login-form").validate({
          rules: {
              username: {
                  required: true
              },
              password: {
                  required: true
              }
          },
          messages: {
              username: {
                  required: "Please provide your username"
              },
              password: {
                  required: "Please provide your password"
              }
          }
       });
    
        $("#unlock-form").validate({
          rules: {
              email: {
                  email: true,
                  required: true
              }
          },
          messages: {
              email: {
                  email: "Please provide the email address associated with your account",
                  required: "Your email address is required"
              }
          }   
       }); 
    
        $("#reset-form").validate({
          rules: {
              password: {
                  required: true,
                  strongPass: true
              },
              confirm: {
                  required: true,
                  equalTo: "#password"
              }
          },
          messages: {
              password: {
                  required: "A new password is required"
              },
              confirm: {
                  required: "Please confirm your new password",
                  equalTo: "Your passwords have to match"
              }
            }   
       }); 
    
       $("#update-form").validate({
          rules: {
              fullName: {
                  required: true
              },
              city: {
                  required: true
              },
              country: {
                  required: true
              }
          },
          messages: {
              fullName: {
                  required: "Your full name is required"
              },
              city: {
                  required: "Your home city is required"
              },
              country: {
                  required: "Your home country is required"
              }
            }   
       }); 
    
});