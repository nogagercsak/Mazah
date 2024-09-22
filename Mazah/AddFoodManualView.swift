import SwiftUI
import FirebaseAuth

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        let scanner = Scanner(string: hex)
        
        if hex.hasPrefix("#") {
            scanner.scanLocation = 1
        }
        
        var color: UInt64 = 0
        scanner.scanHexInt64(&color)
        
        let red = Double((color >> 16) & 0xFF) / 255.0
        let green = Double((color >> 8) & 0xFF) / 255.0
        let blue = Double(color & 0xFF) / 255.0
        
        self.init(red: red, green: green, blue: blue)
    }
}

struct AddFoodManualView: View {
    @Environment(\.presentationMode) var presentationMode
    @StateObject private var viewModel = FoodViewModel()
    @State private var reminderDate: Date = Date()
    @State private var isReminderSet: Bool = false
    @State private var navigateToTrackerHome: Bool = false
    @State private var foodType: String = "Dairy"
    
    let foodTypes = ["Dairy", "Fruit", "Meat", "Grains", "Drinks"]
    
    var body: some View {
        NavigationView {
            ZStack{
                VStack {
                    ScrollView {
                        VStack(spacing: 20) {
                            Section(header:
                                        Text("Food Details")
                                .font(Font.custom("Poppins-Regular", size: 24))
                                .foregroundColor(Color(red: 0.40, green: 0.40, blue: 0.40))
                                .foregroundColor(.gray)
                                .frame(maxWidth: .infinity, alignment: .leading)) {
                                    TextField("Food Name", text: $viewModel.name)
                                        .padding()
                                        .background(Color(UIColor.systemGray5))
                                        .cornerRadius(15)
                                }
                            
                            VStack(alignment: .leading, spacing: 10) {Text("Expiration")
                                    .font(Font.custom("Poppins-Regular", size: 24))
                                    .foregroundColor(Color(red: 0.40, green: 0.40, blue: 0.40))
                                    .foregroundColor(.gray)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                
                                VStack(alignment: .leading, spacing: 10) {
                                    DatePicker("Expiration Date", selection: $viewModel.expirationDate, displayedComponents: .date)
                                        .foregroundColor(Color(red: 0.34, green: 0.41, blue: 0.34))
                                    
                                    Picker("Category", selection: $foodType) {
                                        ForEach(foodTypes, id: \.self) {
                                            Text($0)
                                        }
                                    }
                                    .pickerStyle(SegmentedPickerStyle())
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .padding(15)
                                    
                                    Toggle("Remind me", isOn: $isReminderSet)
                                        .foregroundColor(Color(red: 0.34, green: 0.41, blue: 0.34))
                                    
                                    if isReminderSet {
                                        DatePicker("Remind me on", selection: $reminderDate, displayedComponents: .date)
                                    }
                                }
                                
                                .padding()
                                .background(Color(UIColor.systemGray5))
                                .cornerRadius(15)
                            }
                        }
                        .padding(30)
                    }
                    
                    Button(action: {
                        guard let userId = Auth.auth().currentUser?.uid else {
                            return
                        }
                        viewModel.addFood(forUser: userId, category: foodType)
                        
                    }) {
                        Text("Save")
                            .frame(width: 194, height: 54)
                            .background(Color(red: 0.62, green: 0.76, blue: 0.62))
                            .foregroundColor(.white)
                            .cornerRadius(10)
                            .padding(.horizontal, 90)
                            .font(Font.custom("Poppins-Regular", size: 20))
                    }
                    Text("------ or scan barcode ------")
                        .font(Font.custom("Poppins-Regular", size: 16))
                        .foregroundColor(.gray)
                        .padding(.top, 20)
                    
                    Button(action: {// Scan action here
                    }) {
                        Text("Scan")
                            .font(Font.custom("Poppins-Regular", size: 20))
                            .frame(width: 194, height: 54)
                            .background(Color(red: 0.62, green: 0.76, blue: 0.62))
                            .foregroundColor(.white)
                            .cornerRadius(10)
                            .padding(.top, 20)
                    }
                    .padding(.bottom, 90)
                    
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
                    }
                    )
                }
            }
        }
    }
}

struct AddFoodManualView_Previews: PreviewProvider {
    static var previews: some View {
        AddFoodManualView()
    }
}
