import SwiftUI

struct FoodHistoryView: View {
    @Environment(\.presentationMode) var presentationMode
    
    @StateObject private var viewModel = FoodViewModel()
    let userId: String
    
    @Binding var showSignInView: Bool
    
    var body: some View {
        NavigationView {
            ZStack{
                
            VStack {
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
                
                Spacer()
                
                HStack {
                    Spacer()
                    NavigationLink(destination: AddFoodManualView()) {
                        Text("Add Food Manually +")
                            .padding()
                            .frame(width: 214, height: 60)
                            .background(Color(red: 0.62, green: 0.76, blue: 0.62))
                            .foregroundColor(.white)
                            .cornerRadius(10)
                            .font(Font.custom("Poppins-Regular", size: 18))
                    }
                    .padding()
                }
                NavBar(showSignInView: $showSignInView)
            }
            .navigationBarHidden(false)
            .navigationBarBackButtonHidden(true)
            .navigationBarItems(leading: Button(action: {
                self.presentationMode.wrappedValue.dismiss()
            }) {
                
                HStack {
                    Image(systemName: "chevron.left")
                        .foregroundColor(Color(red: 0.45, green: 0.68, blue: 0))
                    Text("Go back")
                        .underline()
                        .foregroundColor(Color(red: 0.45, green: 0.68, blue: 0))
                }
                                })
            .toolbar {
                ToolbarItem(placement: .principal) {
                    HStack {
                        Text("Your Food")
                            .font(Font.custom("Poppins-Regular", size: 40))
                            .foregroundColor(Color(red: 0.34, green: 0.41, blue: 0.34))
                            .padding(.top, 100)
                            .padding(.horizontal, -10)
                    }
                }
            }
                            }
                        }
                        .onAppear {
                            viewModel.fetchScannedFoods(forUser: userId)
                        }
                    }
    
    private func formattedDate(_ date: Date) -> String {
        let dateFormatter = DateFormatter()
        dateFormatter.dateStyle = .medium
        dateFormatter.timeStyle = .none
        return dateFormatter.string(from: date)
    }
}



struct FoodHistoryView_Previews: PreviewProvider {
    static var previews: some View {
        let mockViewModel = CustomFoodViewModel()
        mockViewModel.scannedFoods = [
            ScannedFoodItem(name: "Apple", scanDate: Date(), expirationDate: Calendar.current.date(byAdding: .day, value: 7, to: Date())!),
            ScannedFoodItem(name: "Milk", scanDate: Date(), expirationDate: Calendar.current.date(byAdding: .day, value: 10, to: Date())!)
        ]
        
        return FoodHistoryView(userId: "sampleUserId", showSignInView: .constant(false))
    }
}

class CustomFoodViewModel: ObservableObject {
    @Published var scannedFoods: [ScannedFoodItem] = []
    func fetchScannedFoods(forUser userId: String) {
    }
}

struct ScannedFoodItem: Identifiable {
    let id = UUID()
    let name: String
    let scanDate: Date
    let expirationDate: Date
}
