//
//  AddFoodManualView.swift
//  Mazah
//
//  Created by Noga Gercsak on 7/4/24.
//

import SwiftUI
import FirebaseAuth
struct AddFoodManualView: View {
    @Environment(\.presentationMode) var presentationMode
    @StateObject private var viewModel = FoodViewModel()
    @State private var reminderDate: Date = Date()
    @State private var isReminderSet: Bool = false
    @State private var navigateToTrackerHome: Bool = false
    @State private var foodType: String = "Dairy"
    
    let foodTypes = ["Dairy", "Produce", "Meat", "Grains", "Beverages"]
    
    var body: some View {
        NavigationView {
            VStack {
                Text("Food!")
                    .font(Font.custom("Radio Canada", size: 45))
                
                ScrollView {
                    VStack {
                        Section(header: Text("Food Details")) {
                            TextField("Food Name", text: $viewModel.name)
                        }
                        
                        Section(header: Text("Expiration")) {
                            DatePicker("Expiration Date", selection: $viewModel.expirationDate, displayedComponents: .date)
                            
                            Picker("Category", selection: $viewModel.foodType) {
                                ForEach(foodTypes, id: \.self) {
                                    Text($0)
                                }
                            }
                            .pickerStyle(MenuPickerStyle())
                            
                            Toggle("Remind me", isOn: $isReminderSet)
                            
                            if isReminderSet {
                                DatePicker("Remind me on", selection: $reminderDate, displayedComponents: .date)
                            }
                        }
                    }
                    .padding()
                    .padding(.top, 100)
                }
                
                Button(action: {
                    guard let userId = Auth.auth().currentUser?.uid else {
                        // Handle error: User is not logged in
                        return
                    }
                    viewModel.addFood(forUser: userId, category: foodType)  // Pass selected category
                }) {
                    Text("Save")
                        .font(Font.custom("Radio Canada", size: 24))
                        .foregroundColor(Color(red: 0.98, green: 0.93, blue: 0.66))
                        .frame(width: 112.73684, height: 40, alignment: .center)
                        .background(Color(red: 0.43, green: 0.51, blue: 0.42))
                        .cornerRadius(30)
                        .padding(.bottom, 90)
                }
                .navigationBarHidden(true)
                .navigationBarBackButtonHidden(true)
                .navigationBarItems(leading: Button(action: {
                    self.presentationMode.wrappedValue.dismiss()
                }) {
                    HStack {
                        Image(systemName: "chevron.left")
                            .foregroundColor(Color(red: 0.45, green: 0.68, blue: 0));
                        Text("Go back")
                            .underline()
                            .foregroundColor(Color(red: 0.45, green: 0.68, blue: 0));
                    }
                }
                    .padding(30)
            }
        }
        
        struct AddFoodManualView_Previews: PreviewProvider {
            static var previews: some View {
                AddFoodManualView()
            }
        }
    }
}
