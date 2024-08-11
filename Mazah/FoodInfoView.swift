import SwiftUI
import FirebaseAuth

struct FoodInfoView: View {
    let name: String
    let imageUrl: String
    let scanDate: Date
    
    @Environment(\.presentationMode) var presentationMode
    @StateObject private var viewModel = FoodViewModel()
    @State private var category = ""

    var body: some View {
        NavigationView {
            ZStack {
                Color(hex: "#FFF6E2").edgesIgnoringSafeArea(.all)
                
                VStack(spacing: 15) {
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
                    }
                    
                    Text(name)
                        .font(.largeTitle)
                        .padding(-10)
                        .foregroundColor(Color(red: 0.34, green: 0.41, blue: 0.34))
                    
                    Text("Scanned on: \(formattedDate(scanDate))")
                        .padding()
                        .foregroundColor(Color(red: 0.34, green: 0.41, blue: 0.34))
                    
                    VStack(alignment: .leading, spacing: 10) {
                        DatePicker("Expiration Date", selection: $viewModel.expirationDate, displayedComponents: .date)
                            .padding()
                            .font(Font.custom("Poppins-Regular", size: 18))
                            .foregroundColor(Color(red: 0.40, green: 0.40, blue: 0.40))
                            .foregroundColor(.gray)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        
                        TextField("Category", text: $category)
                            .padding()
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                    }
                    .padding(10)
                    .background(Color(UIColor.systemGray5))
                    .cornerRadius(15)
                    
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
                            .frame(width: 194, height: 54)
                            .background(Color(red: 0.62, green: 0.76, blue: 0.62))
                            .foregroundColor(.white)
                            .cornerRadius(10)
                            .padding(.horizontal, 90)
                            .font(Font.custom("Poppins-Regular", size: 20))
                    }
                    .padding(.horizontal, -100)
                    .padding(20)
                    
                    if viewModel.showConfirmation {
                        Text("Information confirmed with expiration date: \(formattedDate(viewModel.expirationDate))")
                            .foregroundColor(.green)
                            .padding()
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .cornerRadius(10)
                .padding(30)
            }
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
    }

    private func formattedDate(_ date: Date) -> String {
        let dateFormatter = DateFormatter()
        dateFormatter.dateStyle = .medium
        dateFormatter.timeStyle = .none
        return dateFormatter.string(from: date)
    }
}

struct FoodInfoView_Previews: PreviewProvider {
    static var previews: some View {
        FoodInfoView(
            name: "Sample Food",
            imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRH46GcQkH2ctB5F9XdR4OAszHtjhUELJm09w&s",
            scanDate: Date()
        )
    }
}
