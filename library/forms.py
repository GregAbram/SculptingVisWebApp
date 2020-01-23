from django import forms

class UploadForm(forms.Form):
  type    = forms.CharField(label='type')
  family  = forms.CharField(label='family')
  clss    = forms.CharField(label='clss')
  files = forms.FileField(label='Your files', 
    widget=forms.ClearableFileInput(
      attrs={
        'webkitdirectory': True, 
        'directory': True
      })
    )


