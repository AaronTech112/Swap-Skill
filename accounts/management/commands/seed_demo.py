from django.core.management import call_command
from django.core.management.base import BaseCommand
from accounts.models import User
from marketplace.models import Category, Service, Skill
from swaps.services import (
    accept_swap,
    approve_swap,
    create_review,
    create_swap,
    deliver_swap,
    register_user,
)

DEV_PASSWORD = "Password123!"

MEMBERS_DATA = [
    {
        "email": "amaka.okafor@swapski.ng",
        "full_name": "Amaka Okafor",
        "handle": "ammkaydesigns",
        "headline": "Product designer swapping brand systems for engineering help",
        "bio": "I turn rough concepts into polished interfaces and visual systems for early-stage teams across Lagos and beyond. Looking for backend, analytics, and automation collaborators through Swapski.",
        "location": "Lagos, Nigeria",
        "skills_offered": ["UI Design", "Brand Identity", "Pitch Decks", "Product Strategy"],
        "skills_wanted": ["Backend APIs", "Data Visualization", "Growth Marketing"],
        "service": {
            "title": "Premium UI audit with redesign directions",
            "category": "Design",
            "description": "I review your current interface and return a premium redesign direction with hierarchy, spacing, and system improvements.",
            "credit_cost": 95,
            "delivery_days": 2,
            "skills": ["UI Design", "Product Strategy"],
        },
    },
    {
        "email": "chidi.eze@swapski.ng",
        "full_name": "Chidi Eze",
        "handle": "chidibuilds",
        "headline": "Full-stack builder who swaps code for premium design systems",
        "bio": "I build scalable web apps, automations, and API integrations from Abuja. Swapski is how I exchange implementation work for high-quality design, research, and storytelling support.",
        "location": "Abuja, Nigeria",
        "skills_offered": ["Frontend Dev", "Backend APIs", "No-Code", "Automation"],
        "skills_wanted": ["Brand Identity", "Motion Design"],
        "service": {
            "title": "Build your responsive landing page in Bootstrap",
            "category": "Development",
            "description": "I will turn your Figma or rough concept into a polished static frontend with clean HTML, CSS, JS, and responsive behavior.",
            "credit_cost": 120,
            "delivery_days": 3,
            "skills": ["Frontend Dev", "No-Code"],
        },
    },
    {
        "email": "farida.balogun@swapski.ng",
        "full_name": "Farida Balogun",
        "handle": "faridaresearch",
        "headline": "Academic tutor and researcher helping founders sharpen ideas",
        "bio": "I support teams with desk research, tutoring, and clear writing — whether that's editing a proposal or synthesising a market landscape. Based in Port Harcourt, working remote nationwide.",
        "location": "Port Harcourt, Nigeria",
        "skills_offered": ["Research", "Tutoring", "Copywriting"],
        "skills_wanted": ["UI Design", "Video Editing"],
        "service": {
            "title": "Research sprint with insights and crisp summary",
            "category": "Research",
            "description": "I will investigate your market, compare competitors, and deliver a clean synthesis with actionable next steps.",
            "credit_cost": 80,
            "delivery_days": 2,
            "skills": ["Research", "Copywriting"],
        },
    },
    {
        "email": "tunde.bakare@swapski.ng",
        "full_name": "Tunde Bakare",
        "handle": "tundemotion",
        "headline": "Motion and launch specialist for product-ready stories",
        "bio": "I create polished motion systems, pitch reels, and launch visuals for teams ready to ship. Based in Ibadan — happy to exchange that for dev help, technical setup, and production support.",
        "location": "Ibadan, Nigeria",
        "skills_offered": ["Motion Design", "Video Editing", "Growth Marketing"],
        "skills_wanted": ["No-Code", "Product Strategy"],
        "service": {
            "title": "Launch-ready promo motion for your product",
            "category": "Creative",
            "description": "Short premium motion teaser optimized for web or social launch. Great for startups that need attention fast.",
            "credit_cost": 140,
            "delivery_days": 4,
            "skills": ["Motion Design", "Video Editing"],
        },
    },
]


class Command(BaseCommand):
    help = "Seeds the 4 sample members and real swaps using real business functions"

    def handle(self, *args, **options):
        # Ensure categories & skills exist
        call_command("seed_categories")

        created_users = {}
        created_services = {}

        for data in MEMBERS_DATA:
            email = data["email"]
            user = User.objects.filter(email=email).first()
            if not user:
                user = register_user(
                    email=email,
                    password=DEV_PASSWORD,
                    full_name=data["full_name"],
                    headline=data["headline"],
                    bio=data["bio"],
                    location=data["location"],
                )
                user.handle = data["handle"]
                user.save()
            else:
                user.full_name = data["full_name"]
                user.handle = data["handle"]
                user.headline = data["headline"]
                user.bio = data["bio"]
                user.location = data["location"]
                user.set_password(DEV_PASSWORD)
                user.save()

            # Assign skills
            offered_objs = Skill.objects.filter(name__in=data["skills_offered"])
            wanted_objs = Skill.objects.filter(name__in=data["skills_wanted"])
            user.skills_offered.set(offered_objs)
            user.skills_wanted.set(wanted_objs)

            created_users[data["handle"]] = user

            # Create service
            s_data = data["service"]
            cat = Category.objects.get(name=s_data["category"])
            svc, _ = Service.objects.get_or_create(
                owner=user,
                title=s_data["title"],
                defaults={
                    "category": cat,
                    "description": s_data["description"],
                    "credit_cost": s_data["credit_cost"],
                    "delivery_days": s_data["delivery_days"],
                    "is_active": True,
                },
            )
            svc_skills = Skill.objects.filter(name__in=s_data["skills"])
            svc.skills.set(svc_skills)
            created_services[data["handle"]] = svc

        # Seed 2 realistic swaps through the real service functions
        amaka = created_users["ammkaydesigns"]
        chidi = created_users["chidibuilds"]
        farida = created_users["faridaresearch"]
        tunde = created_users["tundemotion"]

        # Swap 1: Chidi requests Amaka's UI audit -> Amaka accepts (in_progress)
        amaka_svc = created_services["ammkaydesigns"]
        if not amaka_svc.swaps.filter(requester=chidi).exists():
            swap1 = create_swap(
                requester=chidi,
                service=amaka_svc,
                message="Hi Amaka, we need a complete UI review for our SaaS dashboard navigation before launching.",
            )
            accept_swap(amaka, swap1.id)
            self.stdout.write(f"Created in-progress swap #{swap1.id} (Chidi -> Amaka)")

        # Swap 2: Amaka requests Chidi's landing page -> Chidi accepts & delivers (review)
        chidi_svc = created_services["chidibuilds"]
        if not chidi_svc.swaps.filter(requester=amaka).exists():
            swap2 = create_swap(
                requester=amaka,
                service=chidi_svc,
                message="Hey Chidi, could you implement this 3-section landing page using Bootstrap 5 with responsive layout?",
            )
            accept_swap(chidi, swap2.id)
            deliver_swap(
                chidi,
                swap2.id,
                link="https://github.com/swapski-demo/landing-preview",
                note="All 3 sections completed and responsive. Tested down to mobile 375px. Ready for your review!",
            )
            self.stdout.write(f"Created under-review swap #{swap2.id} (Amaka -> Chidi)")

        # Swap 3: Farida requests Tunde's motion teaser -> Tunde delivers -> Farida approves -> Reviews
        tunde_svc = created_services["tundemotion"]
        if not tunde_svc.swaps.filter(requester=farida).exists():
            swap3 = create_swap(
                requester=farida,
                service=tunde_svc,
                message="Hi Tunde, we'd love a 15-second teaser motion video summarizing our research sprint insights.",
            )
            accept_swap(tunde, swap3.id)
            deliver_swap(
                tunde,
                swap3.id,
                link="https://vimeo.com/demo-research-teaser",
                note="Here is the final render at 1080p 60fps with subtitles included.",
            )
            approve_swap(farida, swap3.id)
            create_review(
                author=farida,
                swap_id=swap3.id,
                score=5,
                text="Tunde delivered an amazing motion video on time and with extreme attention to detail!",
            )
            create_review(
                author=tunde,
                swap_id=swap3.id,
                score=5,
                text="Great collaborator, crystal clear requirements, and prompt approval. Highly recommend Farida!",
            )
            self.stdout.write(f"Created completed swap #{swap3.id} with mutual 5-star reviews (Farida <-> Tunde)")

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully seeded demo accounts with password: '{DEV_PASSWORD}'.\n"
                "- amaka.okafor@swapski.ng (@ammkaydesigns)\n"
                "- chidi.eze@swapski.ng (@chidibuilds)\n"
                "- farida.balogun@swapski.ng (@faridaresearch)\n"
                "- tunde.bakare@swapski.ng (@tundemotion)\n"
            )
        )
