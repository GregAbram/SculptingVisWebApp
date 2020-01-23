from django import forms

class UploadForm(forms.Form):
  family  = forms.CharField(label='family')
  clss    = forms.CharField(label='clss')

