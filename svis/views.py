import json
import logging

from django.shortcuts import render
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.http import HttpResponse

logger = logging.getLogger('csp')

@never_cache
def applets(request):
    return render(request, 'index.html', {})

@csrf_exempt
@require_POST
def csp_report(request):
    try:
        report = json.loads(request.body.decode('utf-8'))
        logger.warning('CSP violation: %s', json.dumps(report))
    except Exception as e:
        logger.error('CSP report parse error: %s', e)
    return HttpResponse(status=204)
