/* Reads the CSRF token injected by Django's {% csrf_token %} tag into a
   global variable that Ajax calls can reference.  Load this after jQuery
   and after the {% csrf_token %} tag has been rendered into the DOM. */
var csrftoken = jQuery("[name=csrfmiddlewaretoken]").val();
