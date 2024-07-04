//
//  FoodInfoView.swift
//  Scandit-Practice
//
//  Created by Noga Gercsak on 6/26/24.
//

import SwiftUI
import FirebaseAuth


struct FoodInfoView: View {
    let name: String
    let imageUrl: String
    let scanDate: Date
    
    @StateObject private var viewModel = FoodViewModel()
    
    @State private var category = ""  // Add this state to collect category input

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
            
            DatePicker("Expiration Date", selection: $viewModel.expirationDate, displayedComponents: .date)
                .colorInvert()
                .colorMultiply(Color.blue)
                .padding()
            
            TextField("Category", text: $category)  // Add a TextField to input category
                .padding()
                .textFieldStyle(RoundedBorderTextFieldStyle())
            
            Button(action: {
                guard let userId = Auth.auth().currentUser?.uid else {
                    return
                }
                
                viewModel.name = name
                viewModel.imageUrl = imageUrl
                viewModel.scanDate = scanDate
                viewModel.addFood(forUser: userId, category: category)
            }) {
                Text("Confirm")
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
            .padding()
            
            if viewModel.showConfirmation {
                Text("Information confirmed with expiration date: \(formattedDate(viewModel.expirationDate))")
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
