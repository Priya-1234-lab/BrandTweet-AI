
import json
import os
import requests

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST
from dotenv import load_dotenv

load_dotenv()

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b"


def clean(value, limit=1500):
    return value.strip()[:limit] if isinstance(value, str) else ""


def get_groq_model():
    return os.environ.get("GROQ_MODEL", DEFAULT_GROQ_MODEL).strip()


def demo(data):
    brand = clean(data.get("brand"), 80) or "Your Brand"
    industry = clean(data.get("industry"), 100) or "your industry"
    products = clean(data.get("products"), 1500) or "helpful solutions"
    audience = clean(data.get("audience"), 200) or "our community"
    objective = clean(data.get("objective"), 50) or "Engagement"
    tone = clean(data.get("tone"), 60) or "Friendly and conversational"

    tweets = [
        f"Meet {brand}: making {products} easier for {audience}. What would make your day better?",
        f"Discover a fresh approach to {products} with {brand}.",
        f"Looking for a simpler approach to {products}? Explore what {brand} offers.",
        f"Good products solve real problems. That's the thinking behind {brand}.",
        f"Quick question for {audience}: what matters most to you about {products}?",
        f"At {brand}, we focus on practical ways to make {products} more useful.",
        f"Small improvements can make a difference. How could {products} help your day?",
        f"This one's for {audience}. Share your experience with {products}!",
        f"What is your biggest challenge with {products}? {brand} wants to hear from you.",
        f"Your needs matter. What would you like to learn next from {brand}?",
    ]

    voice = [
        f"Industry: {industry}.",
        f"Tone: {tone}.",
        f"Target audience: {audience}.",
        f"Campaign objective: {objective}.",
        f"Product context: {brand} offers {products}. Highlight practical benefits.",
    ]

    return tweets, voice


def call_groq(prompt, system_message):
    key = os.environ.get("GROQ_API_KEY", "").strip()

    if not key:
        print("Groq AI unavailable: GROQ_API_KEY is not configured.")
        return None

    payload = {
        "model": get_groq_model(),
        "messages": [
            {"role": "system", "content": system_message},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.7,
        "response_format": {"type": "json_object"},
    }

    try:
        response = requests.post(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=45,
        )

        if not response.ok:
            # Log the API error, never log the API key.
            print("Groq status:", response.status_code)
            print("Groq response:", response.text[:1500])
            response.raise_for_status()

        result = response.json()
        content = result["choices"][0]["message"]["content"]
        return json.loads(content)

    except (requests.RequestException, ValueError, KeyError, IndexError) as exc:
        print("Groq request or response error:", repr(exc))
        return None


def generate_ai(data):
    if not os.environ.get("GROQ_API_KEY", "").strip():
        return None

    prompt_data = {
        "brand": clean(data.get("brand"), 80),
        "industry": clean(data.get("industry"), 100) or "Not specified",
        "objective": clean(data.get("objective"), 50) or "Engagement",
        "products": clean(data.get("products"), 1500),
        "audience": clean(data.get("audience"), 200) or "General audience",
        "tone": clean(data.get("tone"), 60) or "Let AI decide",
    }

    prompt = (
        "Create exactly 10 varied X/Twitter draft posts and 4 to 5 brand "
        "voice insights. Each post must be no longer than 280 characters. "
        "Avoid repetitive templates, fake discounts, unsupported claims, "
        "and invented guarantees. Return valid JSON only in this shape: "
        '{"tweets":["draft 1","draft 2"],"voice":["insight 1"]}. '
        "Include exactly 10 tweets. Brand details: "
        + json.dumps(prompt_data, ensure_ascii=False)
    )

    obj = call_groq(
        prompt,
        "You are a careful social media copywriter. Return valid JSON only.",
    )

    if not obj:
        return None

    raw_tweets = obj.get("tweets", [])
    raw_voice = obj.get("voice", [])

    if not isinstance(raw_tweets, list) or not isinstance(raw_voice, list):
        print("Groq response format error: tweets and voice must be lists.")
        return None

    tweets = [
        clean(item, 280)
        for item in raw_tweets
        if isinstance(item, str) and clean(item, 280)
    ]

    voice = [
        clean(item, 350)
        for item in raw_voice
        if isinstance(item, str) and clean(item, 350)
    ]

    if len(tweets) != 10 or not voice:
        print("Groq response validation failed.")
        return None

    return tweets, voice[:5]


def get_request_data(request):
    if len(request.body) > 20000:
        raise ValueError("Request is too large.")

    data = json.loads(request.body.decode("utf-8"))

    if not isinstance(data, dict):
        raise ValueError("JSON body must be an object.")

    return data


def validate_brand_data(data):
    if not clean(data.get("brand"), 80):
        return "Brand name is required."

    if not clean(data.get("products"), 1500):
        return "Product or service details are required."

    return None


@require_GET
def health(request):
    return JsonResponse({
        "status": "ok",
        "ai_enabled": bool(os.environ.get("GROQ_API_KEY", "").strip()),
    })


@csrf_exempt
@require_POST
def generate(request):
    try:
        data = get_request_data(request)
    except (ValueError, UnicodeDecodeError):
        return JsonResponse({"error": "Please send valid JSON."}, status=400)

    error = validate_brand_data(data)
    if error:
        return JsonResponse({"error": error}, status=400)

    allowed_objectives = {
        "Engagement",
        "Promotion",
        "Brand Awareness",
        "Education",
        "Product Launch",
        "Lead Generation",
    }

    allowed_tones = {
        "Let AI decide",
        "Witty and playful",
        "Professional and informative",
        "Bold and motivational",
        "Premium and minimal",
        "Friendly and conversational",
    }

    if data.get("objective") not in allowed_objectives:
        data["objective"] = "Engagement"

    if data.get("tone") not in allowed_tones:
        data["tone"] = "Let AI decide"

    result = generate_ai(data)
    mode = "ai" if result else "demo"

    if mode == "demo":
        print("Tweet generation is using demo mode.")

    tweets, voice = result if result else demo(data)

    return JsonResponse({
        "mode": mode,
        "tweets": tweets,
        "voice": voice,
        "message": "Content generated successfully.",
    })


@csrf_exempt
@require_POST
def analyze_voice(request):
    try:
        data = get_request_data(request)
    except (ValueError, UnicodeDecodeError):
        return JsonResponse({"error": "Please send valid JSON."}, status=400)

    error = validate_brand_data(data)
    if error:
        return JsonResponse({"error": error}, status=400)

    result = generate_ai(data)
    brand = clean(data.get("brand"), 80)

    if result:
        _, voice = result
        return JsonResponse({
            "mode": "ai",
            "brand": brand,
            "voice": voice[:4],
        })

    _, voice = demo(data)

    return JsonResponse({
        "mode": "demo",
        "brand": brand,
        "voice": voice[:4],
    })


@csrf_exempt
@require_POST
def campaign_content(request):
    try:
        data = get_request_data(request)
    except (ValueError, UnicodeDecodeError):
        return JsonResponse({"error": "Please send valid JSON."}, status=400)

    error = validate_brand_data(data)
    if error:
        return JsonResponse({"error": error}, status=400)

    brand = clean(data.get("brand"), 80)
    products = clean(data.get("products"), 1500)
    objective = clean(data.get("objective"), 50) or "Engagement"
    audience = clean(data.get("audience"), 200) or "General audience"
    tone = clean(data.get("tone"), 60) or "Let AI decide"

    prompt = f"""
Create a concise social media campaign plan.

Brand: {brand}
Industry: {clean(data.get("industry"), 100) or "Not specified"}
Objective: {objective}
Products/services: {products}
Target audience: {audience}
Preferred tone: {tone}

Return valid JSON only in this structure:
{{
  "content": [
    "Campaign idea",
    "Key message",
    "Suggested content approach",
    "Call to action"
  ]
}}

Use exactly four useful items. Do not invent discounts,
certifications, ingredients, statistics, or guarantees.
"""

    obj = call_groq(
        prompt,
        "You are a careful marketing strategist. Return valid JSON only.",
    )

    if obj:
        content = obj.get("content", [])

        if (
            isinstance(content, list)
            and len(content) == 4
            and all(isinstance(item, str) and clean(item, 1000) for item in content)
        ):
            return JsonResponse({
                "mode": "ai",
                "content": [clean(item, 1000) for item in content],
            })

        print("Campaign response validation failed.")

    return JsonResponse({
        "mode": "demo",
        "content": [
            f"Campaign objective: {objective}",
            f"Target audience: {audience}",
            f"Introduce {brand} and explain the relevance of {products}.",
            "Invite the audience to learn more or share their thoughts.",
        ],
    })
