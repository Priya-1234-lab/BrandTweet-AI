import json, os, requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST
from dotenv import load_dotenv

load_dotenv()
def clean(value, limit=1500):
    return value.strip()[:limit] if isinstance(value, str) else ""

def demo(data):
    brand = clean(data.get("brand"), 80) or "Your Brand"
    industry = clean(data.get("industry"), 100) or "your industry"
    products = clean(data.get("products"), 1500) or "helpful solutions"
    audience = clean(data.get("audience"), 200) or "our community"
    objective = clean(data.get("objective"), 50) or "Engagement"
    tone = clean(data.get("tone"), 60) or "Friendly and conversational"
    tweets = [
        f"Meet {brand}: making {products} easier for {audience}. What would make your day better?",
        f"Good things are happening at {brand}. Discover a fresh approach to {products}.",
        f"Complicated solutions? Not our style. {brand} is here to make {products} feel simpler.",
        f"A useful starting point: understand your needs, explore your options, and focus on the benefits that matter. That's how {brand} thinks about {products}.",
        f"Quick question for {audience}: what's one thing you wish was easier about {products}? We're listening.",
        f"At {brand}, we believe good products should solve real problems. That's the thinking behind {products}.",
        f"Need a simpler approach to {products}? {brand} wants to help you spend less time worrying about the problem and more time enjoying the solution.",
        f"This one's for {audience}. Share your best tip or experience with {products}, and let's learn from each other.",
        f"One question for our community: what's your biggest challenge with {products}? Explore what {brand} offers.",
        f"Your needs, your priorities, your experience. That's what matters to {brand}. What should we talk about next?",
    ]
    voice = [f"Industry: {industry}.", f"Tone: {tone}.", f"Target audience: {audience}.", f"Campaign objective: {objective}.", f"Product context: {brand} offers {products}. Highlight practical benefits for {audience}."]
    return tweets, voice

def generate_ai(data):
    key = os.environ.get("GROQ_API_KEY", "").strip()
    if not key:
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
        "Create exactly 10 varied X/Twitter draft posts and 4-5 brand voice insights. "
        "Each post must be no longer than 280 characters. Avoid repetitive templates, "
        "fake discounts, unsupported claims, and invented guarantees. Return only JSON in "
        'this shape: {"tweets":["draft 1", "... 10 total"], "voice":["insight 1", "..."]}. '
        "Use these brand details: " + json.dumps(prompt_data, ensure_ascii=False)
    )
    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"},
        json={"model": os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile"),
              "messages": [{"role": "system", "content": "You are a careful social media copywriter. Output valid JSON only."},
                           {"role": "user", "content": prompt}],
              "temperature": 0.7, "response_format": {"type": "json_object"}},
        timeout=45,
    )
    if not response.ok:
        print("Groq status:", response.status_code)
        print("Groq response:", response.text)
    response.raise_for_status()
    obj = json.loads(response.json()["choices"][0]["message"]["content"])
    tweets = [clean(x, 280) for x in obj.get("tweets", []) if isinstance(x, str) and clean(x, 280)]
    voice = [clean(x, 350) for x in obj.get("voice", []) if isinstance(x, str) and clean(x, 350)]
    if len(tweets) != 10:
        return None
    return tweets, voice[:5]

@require_GET
def health(request):
    return JsonResponse({"status": "ok", "ai_enabled": bool(os.environ.get("GROQ_API_KEY", "").strip())})

@csrf_exempt
@require_POST
def generate(request):
    try:
        if len(request.body) > 20000:
            return JsonResponse({"error": "Request is too large."}, status=413)
        data = json.loads(request.body.decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        return JsonResponse({"error": "Please send valid JSON."}, status=400)
    if not clean(data.get("brand"), 80) or not clean(data.get("products"), 1500):
        return JsonResponse({"error": "Brand name and product or service details are required."}, status=400)
    allowed_objectives = {"Engagement", "Promotion", "Brand Awareness", "Education", "Product Launch", "Lead Generation"}
    allowed_tones = {"Let AI decide", "Witty and playful", "Professional and informative", "Bold and motivational", "Premium and minimal", "Friendly and conversational"}
    if data.get("objective") not in allowed_objectives:
        data["objective"] = "Engagement"
    if data.get("tone") not in allowed_tones:
        data["tone"] = "Let AI decide"
    try:
        result = generate_ai(data)
        mode = "ai" if result else "demo"
        print("AI generation mode:", mode)

    except Exception as e:
        print("Groq AI error:", repr(e))
        result = None
        mode = "demo"
    tweets, voice = result if result else demo(data)
    return JsonResponse({"mode": mode, "tweets": tweets, "voice": voice, "message": "Content generated successfully."})

@csrf_exempt
@require_POST
def analyze_voice(request):
    try:
        data = json.loads(request.body.decode("utf-8"))
        brand = clean(data.get("brand"), 80)
        products = clean(data.get("products"), 1500)

        if not brand or not products:
            return JsonResponse(
                {"error": "Brand name and product details are required."},
                status=400,
            )

        result = generate_ai(data)

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

    except Exception as e:
        print("Brand voice error:", repr(e))
        return JsonResponse(
            {"error": "Unable to analyse brand voice. Please try again."},
            status=500,
        )


@csrf_exempt
@require_POST
def campaign_content(request):
    try:
        data = json.loads(request.body.decode("utf-8"))
        brand = clean(data.get("brand"), 80)
        products = clean(data.get("products"), 1500)
        objective = clean(data.get("objective"), 50) or "Engagement"
        audience = clean(data.get("audience"), 200) or "General audience"

        if not brand or not products:
            return JsonResponse(
                {"error": "Brand name and product details are required."},
                status=400,
            )

        key = os.environ.get("GROQ_API_KEY", "").strip()

        if not key:
            return JsonResponse({
                "mode": "demo",
                "content": [
                    f"Campaign objective: {objective}",
                    f"Audience: {audience}",
                    f"Introduce {brand} and explain how its "
                    f"offering, {products}, is relevant to the audience.",
                    "Call to action: Invite the audience to learn more "
                    "or share their thoughts.",
                ],
            })

        prompt = f"""
Create a concise social media campaign plan.

Brand: {brand}
Industry: {clean(data.get("industry"), 100) or "Not specified"}
Objective: {objective}
Products/services: {products}
Target audience: {audience}
Preferred tone: {clean(data.get("tone"), 60) or "Let AI decide"}

Return JSON only in this structure:
{{
  "content": [
    "Campaign idea",
    "Key message",
    "Suggested content approach",
    "Call to action"
  ]
}}

Use exactly four useful items. Do not invent discounts,
certifications, product ingredients, statistics, or guarantees.
"""

        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": "Bearer " + key,
                "Content-Type": "application/json",
            },
            json={
                "model": os.environ.get(
                    "GROQ_MODEL", "openai/gpt-oss-120b"
                ),
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are a careful marketing strategist. "
                            "Return valid JSON only."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.7,
                "response_format": {"type": "json_object"},
            },
            timeout=45,
        )
        response.raise_for_status()
        obj = response.json()["choices"][0]["message"]["content"]
        content = json.loads(obj).get("content", [])

        if not isinstance(content, list) or len(content) != 4:
            raise ValueError("Expected four campaign content items.")

        content = [clean(item, 1000) for item in content]
        if not all(content):
            raise ValueError("Campaign content contains an empty item.")

        return JsonResponse({
            "mode": "ai",
            "content": content,
        })

    except Exception as e:
        print("Campaign content error:", repr(e))
        return JsonResponse(
            {"error": "Campaign generation failed. Please try again."},
            status=500,
        )
