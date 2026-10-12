from django.core.management.base import BaseCommand
from django.utils.text import slugify
from marketplace.models import Category, Skill

CATEGORIES = [
    ("Development", "Web, APIs, frontend, backend and scripts"),
    ("Design", "UI/UX, design systems, visual and product design"),
    ("Creative", "Motion graphics, video editing and creative media"),
    ("Research", "User research, market landscapes and competitive analysis"),
    ("Strategy", "Product strategy, launch planning and roadmap advising"),
    ("Marketing", "Growth, SEO, positioning, and copywriting"),
    ("Tutoring", "Skill sharing, technical mentoring and coaching"),
]

SKILLS = [
    "UI Design",
    "Frontend Dev",
    "Backend APIs",
    "No-Code",
    "Automation",
    "Product Strategy",
    "Motion Design",
    "Video Editing",
    "Copywriting",
    "SEO",
    "Growth Marketing",
    "Research",
    "Tutoring",
    "Brand Identity",
    "Pitch Decks",
    "Data Visualization",
]


class Command(BaseCommand):
    help = "Seeds standard categories and skills for Swapski"

    def handle(self, *args, **options):
        cats_created = 0
        for name, desc in CATEGORIES:
            cat, created = Category.objects.get_or_create(
                name=name,
                defaults={"slug": slugify(name), "description": desc}
            )
            if created:
                cats_created += 1

        skills_created = 0
        for skill_name in SKILLS:
            skill, created = Skill.objects.get_or_create(name=skill_name)
            if created:
                skills_created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully seeded {cats_created} new categories ({Category.objects.count()} total) "
                f"and {skills_created} new skills ({Skill.objects.count()} total)."
            )
        )
