from pathlib import Path
import html
import json
import re
import shutil

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"
PRIMARY = "https://elaheschool.ir"
SECONDARY = "https://schoolelahe.ir"
SITE_NAME = "دنیای الهه | دبستان و پیش‌دبستانی دخترانه الهه"
DEFAULT_DESC = "وب‌سایت رسمی دبستان و پیش‌دبستانی دخترانه الهه؛ معرفی مدرسه، یادگیری، بازی‌های آموزشی، مجله، گالری و همراه والدین."
META = {
    "index.html": (SITE_NAME, DEFAULT_DESC, "/"),
    "school.html": ("مدرسه ما | دنیای الهه", "معرفی دبستان و پیش‌دبستانی دخترانه الهه، رویکرد آموزشی، خلاقیت، کادر و برنامه‌های مدرسه.", "/school.html"),
    "learning.html": ("دنیای یادگیری | دنیای الهه", "مطالب و فعالیت‌های آموزشی، یادگیری خلاق، تمرین‌های کوتاه و ایده‌های کاربردی برای دانش‌آموزان و خانواده‌ها.", "/learning.html"),
    "games.html": ("باشگاه بازی | دنیای الهه", "بازی‌های آموزشی کوتاه و خلاقانه برای تمرین فکر، دقت و یادگیری در دنیای الهه.", "/games.html"),
    "magazine.html": ("مجله الهه | دنیای الهه", "اخبار، مناسبت‌ها، گزارش فعالیت‌ها و روایت‌های مدرسه دخترانه الهه.", "/magazine.html"),
    "gallery.html": ("گالری | دنیای الهه", "گالری فعالیت‌های هنری، جشن‌ها، پروژه‌ها و لحظه‌های دوست‌داشتنی مدرسه الهه.", "/gallery.html"),
    "parents.html": ("همراه والدین | دنیای الهه", "بخش همراه والدین مدرسه الهه برای اطلاعیه‌ها، تقویم، فایل‌ها و محتوای خانواده.", "/parents.html"),
}

EXCLUDE_DIRS = {".git", "dist", ".github"}
EXCLUDE_FILES = {"build.py", "README.md"}


def clean_dist():
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir(parents=True)


def copy_site():
    for src in ROOT.iterdir():
        if src.name in EXCLUDE_DIRS or src.name in EXCLUDE_FILES:
            continue
        dst = DIST / src.name
        if src.is_dir():
            shutil.copytree(src, dst)
        else:
            shutil.copy2(src, dst)


def meta_block(filename: str):
    title, description, path = META.get(filename, (SITE_NAME, DEFAULT_DESC, "/"))
    canonical = PRIMARY + path
    image = PRIMARY + "/assets/logo-official.svg"
    safe_title = html.escape(title, quote=True)
    safe_desc = html.escape(description, quote=True)
    return f'''<meta name="description" content="{safe_desc}"><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"><link rel="canonical" href="{canonical}"><meta property="og:type" content="website"><meta property="og:locale" content="fa_IR"><meta property="og:site_name" content="دنیای الهه"><meta property="og:title" content="{safe_title}"><meta property="og:description" content="{safe_desc}"><meta property="og:url" content="{canonical}"><meta property="og:image" content="{image}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{safe_title}"><meta name="twitter:description" content="{safe_desc}"><meta name="twitter:image" content="{image}">'''


def schema_for(filename: str):
    title, description, path = META.get(filename, (SITE_NAME, DEFAULT_DESC, "/"))
    data = [
        {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "دنیای الهه",
            "url": PRIMARY + "/",
            "inLanguage": "fa-IR",
            "description": DEFAULT_DESC,
        },
        {
            "@context": "https://schema.org",
            "@type": "ElementarySchool",
            "name": "دبستان و پیش‌دبستانی دخترانه الهه",
            "url": PRIMARY + "/school.html",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "خیابان جهاد، کوچه ۵۶",
                "addressLocality": "کرمان",
                "addressCountry": "IR",
            },
            "logo": PRIMARY + "/assets/logo-official.svg",
        },
    ]
    if filename != "index.html":
        data.append({"@context": "https://schema.org", "@type": "WebPage", "name": title, "description": description, "url": PRIMARY + path, "isPartOf": {"@id": PRIMARY + "/"}})
    return "<script type=\"application/ld+json\">" + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "</script>"


def augment_html(path: Path):
    text = path.read_text(encoding="utf-8")
    filename = path.name
    inject_head = meta_block(filename) + "<link rel=\"stylesheet\" href=\"assistant.css\"><script src=\"assistant-knowledge.js\"></script>"
    inject_body = "<script src=\"assistant.js\"></script>"
    text = re.sub(r"<meta name=\"description\"[^>]*>", "", text, count=1, flags=re.I)
    text = text.replace("</head>", inject_head + schema_for(filename) + "</head>", 1)
    if "assistant.js" not in text:
        text = text.replace("</body>", inject_body + "</body>", 1)
    path.write_text(text, encoding="utf-8")


def write_robots():
    (DIST / "robots.txt").write_text("User-agent: *\nAllow: /\nSitemap: " + PRIMARY + "/sitemap.xml\n", encoding="utf-8")


def write_sitemap():
    urls = [PRIMARY + path for _, _, path in META.values()]
    body = "\n".join(f"  <url><loc>{html.escape(u)}</loc><changefreq>weekly</changefreq></url>" for u in urls)
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + body + "\n</urlset>\n"
    (DIST / "sitemap.xml").write_text(xml, encoding="utf-8")


def write_cname():
    (DIST / "CNAME").write_text("elaheschool.ir\n", encoding="utf-8")


if __name__ == "__main__":
    clean_dist()
    copy_site()
    for page in META:
        augment_html(DIST / page)
    write_robots()
    write_sitemap()
    write_cname()
    print(f"Built {len(META)} pages into {DIST}")
