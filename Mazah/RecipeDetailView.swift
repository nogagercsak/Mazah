//
//  RecipeDetailView.swift
//  mazah_api_2
//
//  Created by Riya Zingade on 9/3/24.
//

import SwiftUI

struct RecipeDetailView: View {
    var recipeId: Int // Pass recipe ID instead of the full recipe
    @State private var recipeDetail: RecipeDetail?
    @State private var isLoading = true
    
    var body: some View {
        Group {
            if isLoading {
                ProgressView("Loading recipe details...")
            } else if let recipeDetail = recipeDetail {
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        // Display Recipe Title
                        Text(recipeDetail.title)
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .multilineTextAlignment(.center)
                            .padding(.bottom, 20)
                        
                        // Display Recipe Image (if available)
                        if let imageUrl = recipeDetail.image, let url = URL(string: imageUrl) {
                            AsyncImage(url: url) { phase in
                                if let image = phase.image {
                                    image
                                        .resizable()
                                        .aspectRatio(contentMode: .fill)
                                        .frame(height: 200)
                                        .cornerRadius(10)
                                } else if phase.error != nil {
                                    Text("Failed to load image")
                                } else {
                                    ProgressView() // Loading indicator while the image loads
                                }
                            }
                            .frame(height: 200)
                            .cornerRadius(10)
                            .padding(.bottom, 20)
                        }

                        // Display Ingredients
                        Text("Ingredients")
                            .font(.headline)
                        ForEach(recipeDetail.extendedIngredients, id: \.original) { ingredient in
                            Text("- \(ingredient.original)")
                        }
                        .padding(.bottom, 20)

                        // Display Instructions
                        if let instructions = recipeDetail.instructions {
                            Text("Instructions")
                                .font(.headline)
                            Text(instructions)
                                .font(.body)
                        }
                    }
                    .padding()
                }
            } else {
                Text("Failed to load recipe details.")
            }
        }
        .onAppear {
            fetchRecipeDetails()
        }
    }
    
    func fetchRecipeDetails() {
        NetworkManager.shared.fetchRecipeDetails(recipeId: recipeId) { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let details):
                    self.recipeDetail = details
                    self.isLoading = false
                case .failure(let error):
                    print("Error fetching recipe details: \(error.localizedDescription)")
                    self.isLoading = false
                }
            }
        }
    }
}
