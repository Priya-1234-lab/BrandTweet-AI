
from django.urls import path
from . import views

urlpatterns = [
    path("health/", views.health, name="health"),
    path("generate/", views.generate, name="generate"),
    path("brand-voice/", views.analyze_voice, name="brand_voice"),
    path("campaign-content/", views.campaign_content, name="campaign_content"),
]
