"""Генератор страниц раздела «Подготовка».

Собирает из навигации mkdocs.yml и страниц тем:

- docs/prep/last-hour.md  — шпаргалки всех страниц, подключённые через pymdownx.snippets;
- docs/prep/questions.md  — все вопросы-заголовки `###` со ссылками на их якоря;
- docs/index.md           — число страниц каждого раздела в блоке «Разделы».

Запуск после добавления страницы или вопроса:

    python scripts/prep_pages.py

Этот же файл подключён в mkdocs.yml как хук: если сгенерированные страницы
устарели, сборка пишет предупреждение и `mkdocs build --strict` падает.
"""

import logging
import re
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
LAST_HOUR = DOCS / "prep" / "last-hour.md"
QUESTIONS = DOCS / "prep" / "questions.md"
INDEX = DOCS / "index.md"

# Страницы целиком из генератора: кнопку «Редактировать» у них прячем
GENERATED = {LAST_HOUR, QUESTIONS}

# Разделы навигации, которые не являются темами
SKIP_SECTIONS = {"Старт", "Подготовка"}

# id разделов на сгенерированных страницах
SECTION_IDS = {
    "Java": "java",
    "Многопоточность": "concurrency",
    "Дизайн кода": "design",
    "Spring": "spring",
    "Данные": "data",
    "Kafka": "kafka",
    "System Design": "system-design",
    "Архитектура": "architecture",
    "Инфраструктура": "infrastructure",
    "Computer Science": "cs",
    # Разделы старой навигации — до переезда их страниц
    "Язык Java": "java",
    "Проектирование": "projecting",
}

# id страниц — имя файла; переопределения на случай совпадения с id раздела
PAGE_IDS = {"kafka/kafka.md": "kafka-broker"}

CHEATSHEET_SECTION = "cheatsheet"
HEADING = re.compile(r"^### (?P<title>.+?) \{ #(?P<id>[\w-]+) \}\s*$")
LEVEL = re.compile(r"^\*\*Уровень:\*\* (?P<level>Junior|Middle|Senior)\s*$")
FENCE = re.compile(r"^\s*(`{3,}|~{3,})")
# Раздел на главной: <p class="ip-section__head" markdown>[Spring](...) <span class="ip-section__count">6 страниц</span></p>
SECTION_HEAD = re.compile(
    r'(?P<head><p class="ip-section__head" markdown>\[(?P<name>[^\]]+)\]\([^)]+\) '
    r'<span class="ip-section__count">)(?P<count>[^<]*)(?P<tail></span>)'
)

log = logging.getLogger("mkdocs.hooks.prep_pages")


class _NavLoader(yaml.SafeLoader):
    """Читает mkdocs.yml, игнорируя теги вроде !!python/name и !relative."""


_NavLoader.add_multi_constructor("", lambda loader, suffix, node: None)


def load_sections():
    """[(раздел, [(название страницы, путь от docs/)])] в порядке навигации."""
    config = yaml.load((ROOT / "mkdocs.yml").read_text(encoding="utf-8"), _NavLoader)
    sections = []
    for entry in config["nav"]:
        (name, value), = entry.items()
        if name in SKIP_SECTIONS:
            continue
        sections.append((name, list(_flatten(value))))
    return sections


def _flatten(value):
    if isinstance(value, str):
        yield None, value
        return
    for entry in value:
        (name, child), = entry.items()
        if isinstance(child, str):
            yield name, child
        else:
            yield from _flatten(child)


def page_id(path):
    return PAGE_IDS.get(path, Path(path).stem)


def section_id(name):
    if name not in SECTION_IDS:
        raise KeyError(f"Добавь id для раздела «{name}» в SECTION_IDS в {Path(__file__).name}")
    return SECTION_IDS[name]


def extract_questions(path):
    """[(вопрос, якорь, уровень)] из заголовков `###` вне блоков кода."""
    questions = []
    fence = None
    for line in (DOCS / path).read_text(encoding="utf-8").splitlines():
        match = FENCE.match(line)
        if match:
            marker = match.group(1)
            if fence is None:
                fence = marker
            elif line.strip() == fence[0] * len(line.strip()) and len(line.strip()) >= len(fence):
                fence = None
            continue
        if fence:
            continue
        if line.startswith("### "):
            heading = HEADING.match(line)
            if not heading:
                raise ValueError(f"{path}: у заголовка нет явного id: {line}")
            questions.append([heading["title"], heading["id"], None])
        elif questions and questions[-1][2] is None:
            level = LEVEL.match(line)
            if level:
                questions[-1][2] = level["level"]
    for title, anchor, level in questions:
        if level is None:
            raise ValueError(f"{path}#{anchor}: нет метки уровня под заголовком")
    return questions


def render_last_hour(sections):
    out = [
        "---",
        "tags:",
        "  - Подготовка",
        "---",
        "",
        "<!-- Сгенерировано scripts/prep_pages.py — не редактируй руками. -->",
        "",
        "# За час до собеса",
        "",
        "Шпаргалки всех страниц на одной: прочитай разделы своего стека сверху вниз и проговори каждую строку вслух.",
        "Таблицы подключаются из самих страниц, поэтому здесь всегда та же версия, что и в полном разборе.",
        "",
        '!!! tip "Как повторять"',
        "    Строка не вспоминается за пару секунд — открой полный разбор и прочитай «Ответ вслух» этой темы.",
        "    Новое за час до собеса не учи: только освежай то, что уже разбирал.",
        "",
    ]
    for name, pages in sections:
        out += [f"## {name} {{ #{section_id(name)} }}", ""]
        for title, path in pages:
            out += [
                f"### {title} {{ #{page_id(path)} }}",
                "",
                f"[Полный разбор →](../{path})",
                "",
                f'--8<-- "docs/{path}:{CHEATSHEET_SECTION}"',
                "",
            ]
    return "\n".join(out).rstrip() + "\n"


def render_questions(sections):
    body = []
    total = 0
    for name, pages in sections:
        body += [f"## {name} {{ #{section_id(name)} }}", ""]
        for title, path in pages:
            questions = extract_questions(path)
            total += len(questions)
            body += [f"### {title} {{ #{page_id(path)} }}", ""]
            body += [f"- [{q}](../{path}#{anchor}) — *{level}*" for q, anchor, level in questions]
            body.append("")
    out = [
        "---",
        "tags:",
        "  - Подготовка",
        "---",
        "",
        "<!-- Сгенерировано scripts/prep_pages.py — не редактируй руками. -->",
        "",
        "# Вопросы собеса",
        "",
        f"Все {total} вопросов базы в порядке изучения, у каждого — уровень и ссылка на ответ.",
        "Тренируйся так: прочитай вопрос, ответь вслух за 30 секунд и только потом открой ответ.",
        "",
    ]
    return "\n".join(out + body).rstrip() + "\n"


def pages_word(n):
    """13 страниц, 2 страницы, 21 страница."""
    if n % 10 == 1 and n % 100 != 11:
        return f"{n} страница"
    if 2 <= n % 10 <= 4 and not 12 <= n % 100 <= 14:
        return f"{n} страницы"
    return f"{n} страниц"


def render_index(sections):
    """docs/index.md с числом страниц разделов по навигации."""
    counts = {name: len(pages) for name, pages in sections}
    found = set()

    def replace(match):
        name = match["name"]
        if name not in counts:
            raise KeyError(f"docs/index.md: раздела «{name}» нет в навигации mkdocs.yml")
        found.add(name)
        return match["head"] + pages_word(counts[name]) + match["tail"]

    content = SECTION_HEAD.sub(replace, INDEX.read_text(encoding="utf-8"))
    missing = [name for name in counts if name not in found]
    if missing:
        raise KeyError(f"docs/index.md: добавь в блок «Разделы» раздел {', '.join(missing)}")
    return content


def render():
    sections = load_sections()
    return {
        LAST_HOUR: render_last_hour(sections),
        QUESTIONS: render_questions(sections),
        INDEX: render_index(sections),
    }


def stale_pages():
    return [
        path for path, content in render().items()
        if not path.exists() or path.read_text(encoding="utf-8") != content
    ]


# Хук MkDocs
def on_pre_build(config, **kwargs):
    for path in stale_pages():
        log.warning(
            "%s устарела: запусти `python scripts/prep_pages.py`",
            path.relative_to(ROOT),
        )


def on_page_markdown(markdown, page, **kwargs):
    if DOCS / page.file.src_path in GENERATED:
        page.edit_url = None
    return markdown


if __name__ == "__main__":
    for path, content in render().items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        print(f"записан {path.relative_to(ROOT)}")
