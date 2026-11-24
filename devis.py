"""Devis DEV-2026-CAR-001 — Le Carré.

Régénérer le PDF :  python devis.py
"""

from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Flowable,
    KeepTogether,
    PageBreak,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily, stringWidth
from reportlab.pdfgen import canvas

# À remplir avant envoi au client.
GERANT = "[À CONFIRMER]"
ACOMPTE = "[À CONFIRMER]"
DELAI = "[À CONFIRMER]"

OUT = "Devis-DEV-2026-CAR-001-Le-Carre.pdf"

PAGE_W, PAGE_H = A4
LEFT = 48
RIGHT = 48
TOP = 54
BOTTOM = 62
CONTENT_W = PAGE_W - LEFT - RIGHT

ESPRESSO = HexColor("#1C1612")
INK = HexColor("#2A241F")
GOLD = HexColor("#7A5830")
GOLD_LINE = HexColor("#A68456")
MUTED = HexColor("#5E564E")
RULE = HexColor("#DDD2C3")
PAPER = HexColor("#F6F1E8")
WASH = HexColor("#EADCC6")
CREAM = HexColor("#FBF7F1")

pdfmetrics.registerFont(TTFont("Constantia", r"C:\Windows\Fonts\constan.ttf"))
pdfmetrics.registerFont(TTFont("Constantia-Bold", r"C:\Windows\Fonts\constanb.ttf"))
pdfmetrics.registerFont(TTFont("Constantia-Italic", r"C:\Windows\Fonts\constani.ttf"))
pdfmetrics.registerFont(TTFont("Constantia-BI", r"C:\Windows\Fonts\constanz.ttf"))
pdfmetrics.registerFont(TTFont("Calibri", r"C:\Windows\Fonts\calibri.ttf"))
pdfmetrics.registerFont(TTFont("Calibri-Bold", r"C:\Windows\Fonts\calibrib.ttf"))
pdfmetrics.registerFont(TTFont("Calibri-Italic", r"C:\Windows\Fonts\calibrii.ttf"))
registerFontFamily(
    "Constantia",
    normal="Constantia",
    bold="Constantia-Bold",
    italic="Constantia-Italic",
    boldItalic="Constantia-BI",
)
registerFontFamily(
    "Calibri",
    normal="Calibri",
    bold="Calibri-Bold",
    italic="Calibri-Italic",
    boldItalic="Calibri-Bold",
)

NB = "\u00a0"


def wrap_text(text, font, size, width):
    if not text:
        return []
    words = text.split()
    lines, current = [], ""
    for word in words:
        trial = word if not current else f"{current} {word}"
        if stringWidth(trial, font, size) <= width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def pending(value):
    return value.strip().startswith("[")


def tracked_width(text, font, size, tracking):
    return stringWidth(text, font, size) + tracking * max(len(text) - 1, 0)


def draw_tracked(c, text, x, y, font, size, color, tracking=0, align="left"):
    c.setFillColor(color)
    c.setFont(font, size)
    width = tracked_width(text, font, size, tracking)
    if align == "right":
        c.drawRightString(x, y, text, charSpace=tracking)
    else:
        c.drawString(x, y, text, charSpace=tracking)
    return width


BODY = ParagraphStyle(
    "body",
    fontName="Calibri",
    fontSize=9.5,
    leading=13.4,
    textColor=INK,
    alignment=TA_LEFT,
)
NOTE = ParagraphStyle(
    "note",
    fontName="Calibri-Italic",
    fontSize=8,
    leading=11,
    textColor=MUTED,
)
SIGN_NOTE = ParagraphStyle(
    "sign_note",
    fontName="Calibri",
    fontSize=9,
    leading=12.5,
    textColor=INK,
)
CELL = ParagraphStyle(
    "cell",
    fontName="Calibri",
    fontSize=9,
    leading=12,
    textColor=INK,
)
CELL_R = ParagraphStyle(
    "cell_r",
    parent=CELL,
    alignment=TA_RIGHT,
)
CELL_B = ParagraphStyle(
    "cell_b",
    fontName="Calibri-Bold",
    fontSize=9,
    leading=12,
    textColor=ESPRESSO,
)
CELL_BR = ParagraphStyle(
    "cell_br",
    parent=CELL_B,
    alignment=TA_RIGHT,
)
HEAD = ParagraphStyle(
    "head",
    fontName="Calibri",
    fontSize=8,
    leading=10,
    textColor=CREAM,
)
HEAD_R = ParagraphStyle(
    "head_r",
    parent=HEAD,
    alignment=TA_RIGHT,
)


class Header(Flowable):
    def wrap(self, aw, ah):
        self.aw = aw
        return aw, 68

    def draw(self):
        c = self.canv
        draw_tracked(c, "MAGAR", 0, 44, "Constantia-Bold", 13.5, ESPRESSO, tracking=2.6)

        c.setFillColor(GOLD)
        c.setFont("Constantia-Italic", 11)
        c.drawString(0, 26, "Développement")

        c.setFillColor(MUTED)
        c.setFont("Calibri", 8)
        c.drawString(0, 10, "M. Andrys MAGAR, Auto-entrepreneur")

        label_w = tracked_width("DEVIS", "Calibri", 8, 1.5)
        draw_tracked(
            c, "DEVIS", self.aw - label_w, 50, "Calibri", 8, GOLD, tracking=1.5
        )

        c.setFillColor(ESPRESSO)
        c.setFont("Constantia-Bold", 12)
        c.drawRightString(self.aw, 32, "DEV-2026-CAR-001")

        c.setFillColor(MUTED)
        c.setFont("Calibri", 8)
        c.drawRightString(self.aw, 14, f"23 novembre 2026{NB}·{NB}valable 30 jours")

        c.setStrokeColor(GOLD_LINE)
        c.setLineWidth(0.7)
        c.line(0, 0, self.aw, 0)


class SectionRule(Flowable):
    def __init__(self, text):
        super().__init__()
        self.text = text

    def wrap(self, aw, ah):
        self.aw = aw
        return aw, 14

    def draw(self):
        c = self.canv
        text_w = draw_tracked(c, self.text, 0, 3, "Calibri", 8, GOLD, tracking=1.2)
        c.setStrokeColor(RULE)
        c.setLineWidth(0.45)
        c.line(text_w + 8, 6, self.aw, 6)


class Parties(Flowable):
    def wrap(self, aw, ah):
        self.aw = aw
        return aw, 112

    def _line(self, c, x, y, parts):
        cursor = x
        for text, font, size, color in parts:
            c.setFont(font, size)
            c.setFillColor(color)
            c.drawString(cursor, y, text)
            cursor += stringWidth(text, font, size)

    def _column(self, c, x, rows):
        y = 96
        for row in rows:
            kind = row[0]
            if kind == "label":
                draw_tracked(c, row[1], x, y, "Calibri", 8, GOLD, tracking=1.3)
                y -= 18
            elif kind == "name":
                c.setFillColor(ESPRESSO)
                c.setFont("Constantia-Bold", 12)
                c.drawString(x, y, row[1])
                y -= 16
            elif kind == "pending":
                self._line(
                    c,
                    x,
                    y,
                    [
                        (row[1], "Calibri", 9, INK),
                        (row[2], "Calibri-Italic", 9, GOLD),
                    ],
                )
                y -= 13
            else:
                c.setFillColor(INK)
                c.setFont("Calibri", 9)
                c.drawString(x, y, row[1])
                y -= 13

    def draw(self):
        c = self.canv
        gap = 26
        col_w = (self.aw - gap) / 2
        c.setStrokeColor(RULE)
        c.setLineWidth(0.5)
        c.line(col_w + gap / 2, 6, col_w + gap / 2, 104)

        emitter = [
            ("label", "ÉMETTEUR"),
            ("name", "Magar Développement"),
            ("text", "M. Andrys MAGAR, Auto-entrepreneur"),
            ("text", "Garges-lès-Gonesse, Île-de-France"),
            ("text", "06 41 59 86 88"),
            ("text", "andrys.developper@gmail.com"),
        ]
        client = [
            ("label", "CLIENT"),
            ("name", "Le Carré"),
            ("text", "Saint-Brice-sous-Forêt (95350)"),
            ("pending", "Gérant\u00a0: ", GERANT),
            ("text", "lecartestbrice952020@gmail.com"),
        ]
        self._column(c, 0, emitter)
        self._column(c, col_w + gap, client)


class ObjectBlock(Flowable):
    def __init__(self, text):
        super().__init__()
        self.paragraph = Paragraph(text, BODY)

    def wrap(self, aw, ah):
        self.aw = aw
        _, height = self.paragraph.wrap(aw - 14, ah)
        self.inner_h = height
        self.h = height + 2
        return aw, self.h

    def draw(self):
        self.canv.setFillColor(GOLD_LINE)
        self.canv.rect(0, 0, 2, self.h, fill=1, stroke=0)
        self.paragraph.drawOn(self.canv, 14, 1)


class Offer(Flowable):
    def __init__(self, name, price, items, intro="", featured=False):
        super().__init__()
        self.name = name
        self.price = price
        self.items = items
        self.intro = intro
        self.featured = featured

    def wrap(self, aw, ah):
        self.aw = aw
        inner = aw - 30
        self.intro_lines = (
            wrap_text(self.intro, "Calibri-Italic", 8.5, inner) if self.intro else []
        )
        self.item_lines = [wrap_text(item, "Calibri", 9, inner - 14) for item in self.items]
        height = 13 + 15 + 11
        if self.intro_lines:
            height += len(self.intro_lines) * 12 + 2
        height += sum(len(lines) * 13 for lines in self.item_lines)
        height += 12
        self.h = height
        return aw, height

    def draw(self):
        c = self.canv
        if self.featured:
            c.setFillColor(WASH)
            c.rect(0, 0, self.aw, self.h, fill=1, stroke=0)
            c.setFillColor(GOLD_LINE)
            c.rect(0, 0, 3, self.h, fill=1, stroke=0)
        else:
            c.setStrokeColor(RULE)
            c.setLineWidth(0.5)
            c.line(0, 0, self.aw, 0)

        y = self.h - 24
        c.setFillColor(ESPRESSO)
        c.setFont("Constantia-Bold", 13)
        c.drawString(16, y, self.name)
        if self.featured:
            name_w = stringWidth(self.name, "Constantia-Bold", 13)
            c.setFillColor(GOLD)
            c.setFont("Calibri-Italic", 8.5)
            c.drawString(16 + name_w + 8, y + 1.5, "recommandée")

        c.setFillColor(ESPRESSO)
        c.setFont("Calibri-Bold", 12.5)
        c.drawRightString(self.aw - 14, y, self.price)

        y -= 9
        c.setStrokeColor(GOLD_LINE if self.featured else RULE)
        c.setLineWidth(0.4)
        c.line(16, y, self.aw - 14, y)
        y -= 15

        if self.intro_lines:
            c.setFillColor(GOLD if self.featured else MUTED)
            c.setFont("Calibri-Italic", 8.5)
            for line in self.intro_lines:
                c.drawString(16, y, line)
                y -= 12
            y -= 2

        for lines in self.item_lines:
            for index, line in enumerate(lines):
                if index == 0:
                    c.setFillColor(GOLD_LINE)
                    c.circle(21, y + 2.6, 1.15, fill=1, stroke=0)
                c.setFillColor(INK)
                c.setFont("Calibri", 9)
                c.drawString(30, y, line)
                y -= 13


class CheckLine(Flowable):
    def __init__(self, label, options):
        super().__init__()
        self.label = label
        self.options = options

    def wrap(self, aw, ah):
        self.aw = aw
        return aw, 16

    def draw(self):
        c = self.canv
        c.setFillColor(INK)
        c.setFont("Calibri", 9.5)
        c.drawString(0, 3, self.label)
        x = stringWidth(self.label, "Calibri", 9.5) + 16
        for option in self.options:
            c.setStrokeColor(GOLD)
            c.setLineWidth(0.9)
            c.setFillColor(CREAM)
            c.rect(x, 0.6, 10, 10, stroke=1, fill=1)
            c.setFillColor(INK)
            c.setFont("Calibri", 9.5)
            c.drawString(x + 15, 2.4, option)
            x += 15 + stringWidth(option, "Calibri", 9.5) + 18


class DateLine(Flowable):
    def wrap(self, aw, ah):
        self.aw = aw
        return aw, 18

    def draw(self):
        c = self.canv
        c.setFillColor(INK)
        c.setFont("Calibri", 9.5)
        c.drawString(0, 5, "Date")
        c.setStrokeColor(GOLD)
        c.setLineWidth(0.6)
        c.line(36, 4, 210, 4)


class SignZone(Flowable):
    def wrap(self, aw, ah):
        self.aw = aw
        return aw, 98

    def draw(self):
        c = self.canv
        c.setStrokeColor(RULE)
        c.setFillColor(CREAM)
        c.setLineWidth(0.6)
        c.roundRect(0, 0, self.aw, 98, 2, stroke=1, fill=1)
        c.setStrokeColor(GOLD_LINE)
        c.setLineWidth(0.5)
        c.line(16, 24, 300, 24)
        c.setFillColor(MUTED)
        c.setFont("Calibri", 7.5)
        c.drawString(16, 11, "Signature")


def price_table(rows, highlight_last=False):
    header = [
        Paragraph("Formule" if highlight_last else "Option", HEAD),
        Paragraph("Prix", HEAD_R),
    ]
    data = [header]
    for index, (label, amount) in enumerate(rows):
        last = highlight_last and index == len(rows) - 1
        left_style = CELL_B if last else CELL
        right_style = CELL_BR if last else CELL_R
        data.append([Paragraph(label, left_style), Paragraph(amount, right_style)])

    table = Table(data, colWidths=[CONTENT_W * 0.64, CONTENT_W * 0.36])
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), ESPRESSO),
        ("TEXTCOLOR", (0, 0), (-1, 0), CREAM),
        ("BACKGROUND", (0, 1), (-1, -1), CREAM),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, 0), 7),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
        ("TOPPADDING", (0, 1), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 5),
        ("LINEBELOW", (0, 1), (-1, -2), 0.3, RULE),
        ("BOX", (0, 0), (-1, -1), 0.4, RULE),
    ]
    if highlight_last:
        style.append(("BACKGROUND", (0, -1), (-1, -1), WASH))
    table.setStyle(TableStyle(style))
    return table


def condition_rows():
    items = [
        f"Acompte de <font name='Calibri-Italic' color='#7A5830'>{ACOMPTE}</font> % à la signature, solde à la livraison après validation",
        f"Délai de réalisation\u00a0: <font name='Calibri-Italic' color='#7A5830'>{DELAI}</font> semaines après réception de l'acompte et des contenus",
        "Le client fournit ses contenus\u00a0: logo, photos, carte et prix",
        "Le cahier des charges détaillé est remis après signature du devis",
        "Conformément à la réglementation, la plateforme ne propose ni vente ni promotion de produits du tabac",
    ]
    rows = []
    for item in items:
        mark = Paragraph("·", ParagraphStyle("mark", fontName="Calibri", fontSize=11, leading=13, textColor=GOLD))
        text = Paragraph(item, BODY)
        rows.append([mark, text])
    table = Table(rows, colWidths=[14, CONTENT_W - 14])
    table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 1),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
    return table


def draw_page(c, doc):
    c.saveState()
    c.setFillColor(PAPER)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(ESPRESSO)
    c.rect(0, PAGE_H - 7, PAGE_W, 7, fill=1, stroke=0)
    c.setFillColor(GOLD_LINE)
    c.rect(0, PAGE_H - 9.2, PAGE_W, 2.2, fill=1, stroke=0)

    if doc.page > 1:
        c.setFillColor(ESPRESSO)
        c.setFont("Constantia-Bold", 9)
        c.drawString(LEFT, PAGE_H - 32, "Magar Développement")
        c.setFillColor(MUTED)
        c.setFont("Calibri", 8)
        c.drawRightString(PAGE_W - RIGHT, PAGE_H - 32, "Devis n° DEV-2026-CAR-001")
        c.setStrokeColor(GOLD_LINE)
        c.setLineWidth(0.6)
        c.line(LEFT, PAGE_H - 40, PAGE_W - RIGHT, PAGE_H - 40)

    c.setStrokeColor(RULE)
    c.setLineWidth(0.4)
    c.line(LEFT, 48, PAGE_W - RIGHT, 48)
    c.setFillColor(MUTED)
    c.setFont("Calibri", 7.4)
    footer = [
        f"Magar Développement  ·  M. Andrys MAGAR, Auto-entrepreneur  ·  SIRET 908 058 092 00028",
        f"Garges-lès-Gonesse, Île-de-France  ·  Tél. 06 41 59 86 88  ·  andrys.developper@gmail.com  ·  magar-developpement.fr",
        "TVA non applicable, art. 293 B du CGI",
    ]
    y = 35
    for line in footer:
        c.drawString(LEFT, y, line)
        y -= 10
    c.restoreState()


class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        page_count = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.setFillColor(MUTED)
            self.setFont("Calibri", 8)
            label = f"{self._pageNumber}  /  {page_count}"
            self.drawRightString(PAGE_W - RIGHT, 24, label)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)


def build():
    doc = SimpleDocTemplate(
        OUT,
        pagesize=A4,
        leftMargin=LEFT,
        rightMargin=RIGHT,
        topMargin=TOP,
        bottomMargin=BOTTOM,
        title="Devis DEV-2026-CAR-001 — Le Carré",
        author="Magar Développement",
        subject="Création d'une plateforme web sur mesure pour Le Carré",
    )

    essentiel = Offer(
        "Essentiel",
        f"2{NB}500{NB}€",
        [
            "Site vitrine du lounge : ambiance, photos, horaires, accès",
            "Réservation de tables en ligne, avec confirmation par mail",
            "Carte digitale accessible par QR code sur les tables",
            "Espace gérant : suivi des réservations et mise à jour de la carte",
            "Adapté mobile, tablette et ordinateur",
            "Mise en ligne et nom de domaine la première année",
        ],
    )
    pro = Offer(
        "Pro",
        f"3{NB}200{NB}€",
        [
            "Commande à table depuis le téléphone, reçue directement au bar",
            "Événements : soirées à thème, matchs, demandes de privatisation",
            "Plan de salle et gestion des tables",
            "Statistiques simples : réservations et commandes",
        ],
        intro="Tout le contenu de la formule Essentiel, plus :",
    )
    premium = Offer(
        "Premium",
        f"4{NB}200{NB}€",
        [
            "Programme de fidélité : points, offres, cadeau d'anniversaire",
            "Confirmations et rappels de réservation par SMS",
            "Statistiques détaillées : heures d'affluence, produits les plus vendus, clients fidèles",
        ],
        intro="Tout le contenu de la formule Pro, plus :",
        featured=True,
    )

    objet = (
        "Création d'une plateforme web sur mesure pour Le Carré\u00a0: "
        "réservation de tables, carte digitale, commande à table, programme de fidélité, "
        "gestion des événements et espace de gestion pour le gérant."
    )

    story = [
        Header(),
        Spacer(1, 16),
        Parties(),
        Spacer(1, 16),
        SectionRule("OBJET"),
        Spacer(1, 8),
        ObjectBlock(objet),
        Spacer(1, 16),
        KeepTogether([SectionRule("LES FORMULES"), Spacer(1, 9), essentiel]),
        Spacer(1, 7),
        pro,
        Spacer(1, 7),
        premium,
        PageBreak(),
        SectionRule("RÉCAPITULATIF"),
        Spacer(1, 8),
        price_table(
            [
                ("Essentiel", f"2{NB}500{NB}€"),
                ("Pro", f"3{NB}200{NB}€"),
                (
                    f"Premium&nbsp;&nbsp;<font name='Calibri-Italic' size='8' color='#7A5830'>recommandée</font>",
                    f"4{NB}200{NB}€",
                ),
            ],
            highlight_last=True,
        ),
        Spacer(1, 5),
        Paragraph("TVA non applicable, art. 293 B du CGI.", NOTE),
        Spacer(1, 16),
        SectionRule("OPTIONS MENSUELLES"),
        Spacer(1, 8),
        price_table(
            [
                ("Maintenance, mises à jour et sécurité", f"49{NB}€ / mois"),
                (
                    "Gestion Google Ads et référencement",
                    f"290{NB}€ / mois (hors budget publicitaire)",
                ),
                ("Envoi de SMS (formule Premium)", "Facturé selon la consommation"),
            ]
        ),
        Spacer(1, 16),
        KeepTogether(
            [
                SectionRule("CONDITIONS"),
                Spacer(1, 8),
                condition_rows(),
            ]
        ),
        Spacer(1, 16),
        KeepTogether(
            [
                SectionRule("BON POUR ACCORD"),
                Spacer(1, 10),
                CheckLine("Formule choisie", ["Essentiel", "Pro", "Premium"]),
                Spacer(1, 7),
                CheckLine("Options", ["Maintenance", "Google Ads et référencement"]),
                Spacer(1, 12),
                DateLine(),
                Spacer(1, 12),
                Paragraph(
                    f"Signature du client, précédée de la mention «{NB}Bon pour accord{NB}»\u00a0:",
                    SIGN_NOTE,
                ),
                Spacer(1, 6),
                SignZone(),
            ]
        ),
    ]
    doc.build(story, onFirstPage=draw_page, onLaterPages=draw_page, canvasmaker=NumberedCanvas)


if __name__ == "__main__":
    build()
    print(OUT)
