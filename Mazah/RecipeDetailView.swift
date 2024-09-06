import SwiftUI

struct RecipeDetailView: View {
    var recipeId: Int
    @State private var recipeDetail: RecipeDetail?
    @State private var isLoading = false

    var body: some View {
        Group {
            if isLoading {
                ProgressView("Loading recipe details...")
            } else if let recipeDetail = recipeDetail {
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        // Display Recipe Title
                        Text(recipeDetail.title)
                            .font(Font.custom("Poppins-Regular", size: 24))
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
            if !isPreview {
                fetchRecipeDetails()
            } else {
                self.recipeDetail = mockRecipeDetail()
                self.isLoading = false
                }
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


    func mockRecipeDetail() -> RecipeDetail {
        return RecipeDetail(
            id: 1,
            title: "Mock Recipe Title",
            image: "https://via.placeholder.com/200",
            summary: "This is a brief summary of the mock recipe.",
            extendedIngredients: [
                RecipeDetail.Ingredient(id: 1, original: "1 cup mock ingredient")
            ],
            instructions: "Mix all ingredients and cook for 30 minutes."
        )
    }
}

extension RecipeDetailView {
    var isPreview: Bool {
        ProcessInfo.processInfo.environment["XCODE_RUNNING_FOR_PREVIEW"] == "1"
    }
}

struct RecipeDetailView_Previews: PreviewProvider {
    static var previews: some View {
        RecipeDetailView(recipeId: 1)
            .previewLayout(.sizeThatFits)
    }
}
