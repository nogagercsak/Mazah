//
//  SettingsView.swift
//  Mazah
//
//  Created by Noga Gercsak on 6/1/24.
//

import SwiftUI

struct SettingsView: View {
    
    @StateObject private var viewModel = SettingsViewModel()
    @Binding var showSignInView: Bool
    @State private var newEmail: String = ""
    @State private var newPassword: String = ""
    @State private var confirmPassword: String = ""
    @State private var isEmailUpdated: Bool = false
    @State private var isPasswordUpdated: Bool = false
    @State private var errorMessage: String?
    
    var body: some View {
        ZStack{
            Color(hex: "#FFF6E2")
                .edgesIgnoringSafeArea(.all)
            VStack {
                List {
                    Button("Log out") {
                        Task {
                            do {
                                try viewModel.signOut()
                                showSignInView = true
                            } catch {
                                print(error)
                            }
                        }
                    }
                    .listRowBackground(Color.clear)
                    .padding(8)
                    .background(Color(red: 0.43, green: 0.51, blue: 0.42))
                    .foregroundColor(.white)
                    .cornerRadius(10)
                    
                    Button(role: .destructive) {
                        Task {
                            do {
                                try await viewModel.deleteAccount()
                                showSignInView = true
                            } catch {
                                print(error)
                            }
                        }
                    } label: {
                        Text("Delete account")
                    }
                    .listRowBackground(Color.clear)
                    .padding(8)
                    .background(.white)
                    .foregroundColor(.red)
                    .cornerRadius(10)
                    emailSection
                        .listRowBackground(Color.clear)
                }
                .listStyle(.plain)
                .background(Color(hex: "#FFF6E2"))
                .navigationTitle("Settings")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .principal) {
                    Text("Settings")
                    .font(Font.custom("Poppins-Regular", size: 23))
                    .foregroundColor(Color(red: 0.43, green: 0.51, blue: 0.42))
                    .padding(.top, 0)
                    }
                }
                                
                                Spacer()
                                
                                NavBar(showSignInView: $showSignInView)
                            }
            .alert(isPresented: $isEmailUpdated) {
                Alert(title: Text("Success"), message: Text("Email updated successfully"), dismissButton: .default(Text("OK")))
            }
            .alert(isPresented: $isPasswordUpdated) {
                Alert(title: Text("Success"), message: Text("Password updated successfully"), dismissButton: .default(Text("OK")))
            }
        }
    }
}

struct SettingsView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationStack {
            SettingsView(showSignInView: .constant(false))
        }
    }
}

extension SettingsView {
    
    private var emailSection: some View {
        Section {
            TextField("New Email", text: $newEmail)
                .keyboardType(.emailAddress)
                .autocapitalization(.none)
            
            Button("Update Email") {
                Task {
                    do {
                        try await viewModel.updateEmail(newEmail: newEmail)
                        isEmailUpdated = true
                        errorMessage = nil
                    } catch {
                        errorMessage = "Failed to update email: \(error.localizedDescription)"
                    }
                }
            }
            
            SecureField("New Password", text: $newPassword)
            SecureField("Confirm Password", text: $confirmPassword)
            
            Button("Change Password") {
                Task {
                    guard newPassword == confirmPassword else {
                        errorMessage = "Passwords do not match"
                        return
                    }
                    do {
                        try await viewModel.updatePassword(newPassword: newPassword)
                        isPasswordUpdated = true
                        errorMessage = nil
                    } catch {
                        errorMessage = "Failed to update password: \(error.localizedDescription)"
                    }
                }
            }
        } header: {
            Text("Email & Password Functions")
                .font(Font.custom("Poppins-Regular", size: 15))
                .foregroundColor(Color(red: 0.43, green: 0.51, blue: 0.42))
                .padding(.top, 0)
        }
    }
}
