//
//  FoodHistoryView.swift
//  Mazah
//
//  Created by Noga Gercsak on 7/4/24.
//

import SwiftUI

struct FoodHistoryView: View {
    @StateObject private var viewModel = FoodViewModel()
    let userId: String
    
    var body: some View {
        NavigationView {
            List(viewModel.scannedFoods) { food in
                VStack(alignment: .leading) {
                    Text(food.name)
                        .font(.headline)
                    Text("Scanned on: \(formattedDate(food.scanDate))")
                        .font(.subheadline)
                    Text("Expires on: \(formattedDate(food.expirationDate))")
                        .font(.subheadline)
                }
            }
            .navigationTitle("Your Foods")
            .onAppear {
                viewModel.fetchScannedFoods(forUser: userId)
            }
        }
    }
    
    private func formattedDate(_ date: Date) -> String {
        let dateFormatter = DateFormatter()
        dateFormatter.dateStyle = .medium
        dateFormatter.timeStyle = .none
        return dateFormatter.string(from: date)
    }
}
