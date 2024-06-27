//
//  FoodInfoView.swift
//  Scandit-Practice
//
//  Created by Noga Gercsak on 6/26/24.
//

import SwiftUI

struct FoodInfoView: View {
    let name: String
    let imageUrl: String
    let scanDate: Date

    @State private var expirationDate: Date = Date()
    @State private var showConfirmation: Bool = false

    var body: some View {
        VStack {
            if let url = URL(string: imageUrl) {
                AsyncImage(url: url) { image in
                    image.resizable()
                         .scaledToFit()
                         .frame(width: 200, height: 200)
                } placeholder: {
                    ProgressView()
                }
                .padding()
            } else {
                Image("placeholder_image")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 200, height: 200)
                    .padding()
            }

            Text(name)
                .font(.largeTitle)
                .padding()
                .foregroundColor(Color.blue)

            Text("Scanned on: \(formattedDate(scanDate))")
                .padding()
                .foregroundColor(Color.blue)
            
            DatePicker("Expiration Date", selection: $expirationDate, displayedComponents: .date)
                .colorInvert()
                .colorMultiply(Color.blue)
                .padding()

            Button(action: {
                showConfirmation = true
            }) {
                Text("Confirm")
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
            .padding()

            if showConfirmation {
                Text("Information confirmed with expiration date: \(formattedDate(expirationDate))")
                    .foregroundColor(.green)
                    .padding()
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.white)
        .cornerRadius(10)
        .shadow(radius: 10)
        .padding()
    }

    private func formattedDate(_ date: Date) -> String {
        let dateFormatter = DateFormatter()
        dateFormatter.dateStyle = .medium
        dateFormatter.timeStyle = .none
        return dateFormatter.string(from: date)
    }
}
