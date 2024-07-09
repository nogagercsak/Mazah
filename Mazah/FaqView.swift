//
//  FaqView.swift
//  Mazah
//
//  Created by Gabrielle on 09.07.2024.
//

import SwiftUI

struct FAQView: View {
    let faqs = [
        FAQ(question: "How long can I store fresh fruits and vegetables?", answer: "Fresh fruits and vegetables vary widely in their storage times -- from a few days to several weeks. Very few can be safely stored at room temperature for long, and most must be kept in the refrigerator. Bruises and mold are signs of spoilage."),
        FAQ(question: "How can I extend the shelf life of fruits and vegetables?", answer: "Place fruits and vegetables in separate, perforated plastic bags. Store in the crisper drawer of the fridge. Keep bananas, apples, and tomatoes separate from other produce, as they emit ethylene gas, which can cause other fruits and vegetables to ripen faster."),
        FAQ(question: "How long can I store dairy products?", answer: "Yogurt - 1 to 2 weeks in the fridge; Soft cheeses - 1 week in the fridge; Hard cheeses - 3 to 4 weeks in the fridge after opening; Processed cheese slices - 1 to 2 months; Milk - 7 days; Sour cream - 1 to 3 weeks"),
        FAQ(question: "How long can I store dairy products?", answer: "Yogurt - 1 to 2 weeks in the fridge; Soft cheeses - 1 week in the fridge; Hard cheeses - 3 to 4 weeks in the fridge after opening; Processed cheese slices - 1 to 2 months; Milk - 7 days; Sour cream - 1 to 3 weeks"),
        FAQ(question: "How can I extend the shelf life of dairy products?",answer: """
                    - Keep dairy products in the coldest part of the fridge, usually the back.
                    - Store cheese in wax paper or cheese paper to allow it to breathe.
                    - Keep milk and yogurt tightly sealed to prevent contamination.
                    """),
        FAQ(question: "How long can I store meat and seafood?",answer: """
                    - Fresh poultry, seafood: 1 to 2 days in the fridge before cooking or freezing.
                    - Fresh Beef/Pork: 3 to 5 days in the fridge before cooking or freezing.
                    - After cooking, meat, poultry, and seafood can be safely stored in the refrigerator for 3 to 4 days.
                    - Source: USDA
                    """),
        FAQ(question: "How can I extend the shelf life of meat and seafood?",
                    answer: """
                    - Freeze meat and seafood if not using within a couple of days.
                    - Store meat in its original packaging or rewrap in plastic wrap and foil.
                    - Place seafood on a bed of ice in the fridge to keep it extra cold.
                    """),
        FAQ(question: "How long can I store grains and baked goods?",answer: """
                    - Bread: 1-2 weeks at room temperature; up to 3 months in the freezer.
                    - Pasta (dry): 1-2 years in the pantry.
                    - Rice (dry): 2 years in the pantry.
                    - Whole grains: 1 to 3 months on a cool, dry pantry shelf or 2 to 6 months in the freezer.
                    """),
        FAQ(question: "How can I extend the shelf life of grains and baked goods?",answer: """
                    - Keep bread in a cool, dry place or freeze for longer storage.
                    - Store dry grains in airtight containers to keep out moisture and pests.
                    - Use vacuum-sealed bags for long-term storage of grains and pasta.
                    """),
        FAQ(question: "How long can I store canned and dry goods?",answer: """
                    - Most shelf-stable foods are safe indefinitely.
                    - Canned goods will last for years if the can is in good condition (no rust, dents, or swelling).
                    - Packaged foods (cereal, pasta, cookies) will be safe past the ‘best by’ date, although they may eventually become stale or develop an off flavor.
                    - Source: USDA
                    """),
        FAQ(question: "How long can I store leftovers in the fridge?",answer: """
                    - Leftovers can be kept in the refrigerator for three to four days or frozen for three to four months.
                    - Frozen leftovers can lose moisture and flavor when stored for longer times.
                    - Source: USDA
                    """),
        FAQ(question: "This food does not smell or look bad even though its expiration date has expired. Is it still safe to consume?",
                    answer: """
                    - Some harmful bacteria can grow without affecting the smell, taste, or texture of the food.
                    - Follow the general rule of “when in doubt, throw it out!” for expired food.
                    - Source: International Dairy Foundation
                    """),
        FAQ(question: "Can I eat a product after the 'best before' or expiration date?",
                    answer: """
                    - Foods can generally be consumed safely for a short period after their 'best before' date.
                    - Avoid consuming foods after their expiration date, as they may no longer be fit for consumption.
                    - Source: International Dairy Foundation
                    """
                ),
        FAQ(question: "Why should I care about food storage and preparation?",
                    answer: """
                    - Properly storing and consuming food before it spoils helps reduce food waste and its environmental impact.
                    - “Cutting food waste is a delicious way of saving money, helping to feed the world and protect the planet.” – Tristram Stuart
                    """
                ),
        FAQ(question: "How can I tell if food has gone bad?",
                    answer: """
                    - Look for changes in color, texture, or smell.
                    - Check for mold or unusual spots.
                    - Throw away moldy food!
                    """
                ),
        FAQ(question: "What temperature should I keep my fridge at?",
                    answer: """
                    - Refrigerators should be set to maintain a temperature of 40 °F (4.4 °C) or below.
                    - Your freezer should be set at 0°F (-18°C).
                    """ ),
    ]

    var body: some View {
        NavigationView {
            List(faqs, id: \.question) { faq in
                DisclosureGroup(
                    content: {
                        Text(faq.answer)
                            .padding()
                            .foregroundColor(.secondary)
                    },
                    label: {
                        Text(faq.question)
                            .font(.headline)
                            .foregroundColor(.primary)
                    }
                )
            }
            .navigationTitle("FAQs on Food Storage")
        }
    }
}

struct FAQ: Identifiable {
    let id = UUID()
    let question: String
    let answer: String
}

struct FAQView_Previews: PreviewProvider {
    static var previews: some View {
        FAQView()
    }
}

