package com.carshop.service;

import com.carshop.model.CustomerOrder;
import com.carshop.model.OrderItem;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import org.springframework.stereotype.Service;

/** Renders the bill for a paid order as a downloadable PDF. */
@Service
public class InvoicePdfService {

    private static final Color BRAND = new Color(37, 99, 235);
    private static final Color MUTED = new Color(100, 116, 139);
    private static final Color STRIPE = new Color(241, 245, 249);

    private final NumberFormat money = NumberFormat.getCurrencyInstance(Locale.US);

    public byte[] render(CustomerOrder order) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 48, 48, 48, 48);
        PdfWriter.getInstance(doc, out);
        doc.open();

        Font brand = new Font(Font.HELVETICA, 24, Font.BOLD, BRAND);
        Font h = new Font(Font.HELVETICA, 11, Font.BOLD);
        Font body = new Font(Font.HELVETICA, 10);
        Font muted = new Font(Font.HELVETICA, 9, Font.NORMAL, MUTED);
        Font white = new Font(Font.HELVETICA, 10, Font.BOLD, Color.WHITE);
        Font big = new Font(Font.HELVETICA, 13, Font.BOLD, BRAND);

        PdfPTable header = new PdfPTable(2);
        header.setWidthPercentage(100);
        header.addCell(plain(new Phrase("AutoMart", brand), Element.ALIGN_LEFT));
        Phrase inv = new Phrase();
        inv.add(new Phrase("INVOICE\n", new Font(Font.HELVETICA, 16, Font.BOLD)));
        inv.add(new Phrase(order.getInvoiceNumber() + "\n", body));
        inv.add(new Phrase(order.getCreatedAt().format(DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm")), muted));
        header.addCell(plain(inv, Element.ALIGN_RIGHT));
        doc.add(header);

        doc.add(new Paragraph("123 Motor Avenue, Detroit, MI 48201  ·  sales@automart.example", muted));
        doc.add(new Paragraph(" "));

        PdfPTable parties = new PdfPTable(2);
        parties.setWidthPercentage(100);
        Phrase billTo = new Phrase();
        billTo.add(new Phrase("BILL TO\n", muted));
        billTo.add(new Phrase(order.getCustomerName() + "\n", h));
        billTo.add(new Phrase(order.getAddress() + "\n" + order.getEmail() + "\n" + order.getPhone(), body));
        parties.addCell(plain(billTo, Element.ALIGN_LEFT));
        Phrase pay = new Phrase();
        pay.add(new Phrase("PAYMENT\n", muted));
        pay.add(new Phrase(order.getPaymentStatus() + "\n", new Font(Font.HELVETICA, 11, Font.BOLD, new Color(22, 163, 74))));
        pay.add(new Phrase(order.getCardBrand() + " •••• " + order.getCardLast4() + "\n" + order.getTransactionId(), body));
        parties.addCell(plain(pay, Element.ALIGN_RIGHT));
        doc.add(parties);
        doc.add(new Paragraph(" "));

        PdfPTable items = new PdfPTable(new float[] {5, 1.2f, 2, 2});
        items.setWidthPercentage(100);
        for (String col : new String[] {"Vehicle", "Qty", "Unit price", "Amount"}) {
            PdfPCell c = new PdfPCell(new Phrase(col, white));
            c.setBackgroundColor(BRAND);
            c.setBorder(Rectangle.NO_BORDER);
            c.setPadding(8);
            c.setHorizontalAlignment(col.equals("Vehicle") ? Element.ALIGN_LEFT : Element.ALIGN_RIGHT);
            items.addCell(c);
        }
        int row = 0;
        for (OrderItem it : order.getItems()) {
            Color bg = row++ % 2 == 0 ? Color.WHITE : STRIPE;
            items.addCell(cell(it.getCarName(), body, Element.ALIGN_LEFT, bg));
            items.addCell(cell(String.valueOf(it.getQuantity()), body, Element.ALIGN_RIGHT, bg));
            items.addCell(cell(fmt(it.getUnitPrice()), body, Element.ALIGN_RIGHT, bg));
            items.addCell(cell(fmt(it.getLineTotal()), body, Element.ALIGN_RIGHT, bg));
        }
        doc.add(items);

        PdfPTable totals = new PdfPTable(new float[] {6, 3.2f, 2});
        totals.setWidthPercentage(100);
        totals.setSpacingBefore(8);
        totalRow(totals, "Subtotal", fmt(order.getSubtotal()), body);
        totalRow(totals, "Documentation fees", fmt(order.getDocFees()), body);
        totalRow(totals, "Sales tax", fmt(order.getTax()), body);
        totalRow(totals, "Total paid", fmt(order.getTotal()), big);
        doc.add(totals);

        doc.add(new Paragraph(" "));
        Paragraph thanks = new Paragraph("Thank you for buying with AutoMart!", h);
        thanks.setAlignment(Element.ALIGN_CENTER);
        doc.add(thanks);
        Paragraph note = new Paragraph("This is a computer-generated invoice and does not require a signature.", muted);
        note.setAlignment(Element.ALIGN_CENTER);
        doc.add(note);

        doc.close();
        return out.toByteArray();
    }

    private String fmt(BigDecimal v) {
        return money.format(v);
    }

    private static PdfPCell plain(Phrase p, int align) {
        PdfPCell c = new PdfPCell(p);
        c.setBorder(Rectangle.NO_BORDER);
        c.setHorizontalAlignment(align);
        return c;
    }

    private static PdfPCell cell(String text, Font f, int align, Color bg) {
        PdfPCell c = new PdfPCell(new Phrase(text, f));
        c.setBorder(Rectangle.BOTTOM);
        c.setBorderColor(new Color(226, 232, 240));
        c.setBackgroundColor(bg);
        c.setPadding(8);
        c.setHorizontalAlignment(align);
        return c;
    }

    private static void totalRow(PdfPTable t, String label, String value, Font f) {
        t.addCell(plain(new Phrase(""), Element.ALIGN_LEFT));
        PdfPCell l = plain(new Phrase(label, f), Element.ALIGN_RIGHT);
        l.setPadding(4);
        t.addCell(l);
        PdfPCell v = plain(new Phrase(value, f), Element.ALIGN_RIGHT);
        v.setPadding(4);
        t.addCell(v);
    }
}
