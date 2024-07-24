import SwiftUI
struct FoodHistoryView: View {
    @StateObject private var viewModel: CustomFoodViewModel
    let userId: String
    @Environment(\.presentationMode) var presentationMode: Binding<PresentationMode>
    
    init(userId: String, viewModel: CustomFoodViewModel = CustomFoodViewModel()) {
        self.userId = userId
        self._viewModel = StateObject(wrappedValue: viewModel)
    }
    
    var body: some View {
        NavigationView {
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
            }
            .navigationTitle("Your Food")
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
        
        return FoodHistoryView(userId: "sampleUserId", viewModel: mockViewModel)
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

