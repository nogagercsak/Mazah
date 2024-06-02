//
//  SettingsView.swift
//  Mazah
//
//  Created by Noga Gercsak on 6/1/24.
//

import SwiftUI

struct SettingsView: View {
    
    @StateObject private var viewModel = SettingsViewModel()
    @Binding  var showSignInView: Bool
    
    var body: some View {
        VStack {
            List{
                Button("Log out"){
                    Task{
                        do{
                            try viewModel.signOut()
                            showSignInView = true
                        } catch {
                            print(error)
                        }
                    }
                }
                
                Button(role: .destructive){
                    Task{
                        do{
                            try await viewModel.deleteAccount()
                            showSignInView = true
                        } catch {
                            print(error)
                        }
                    }
                } label: {
                    Text("Delete account")
                }
                
                emailSection
                
            }
            .navigationTitle("Settings")
            
            Spacer()
            
            NavBar(showSignInView: $showSignInView)
        }
    }
}

struct SettingsView_Previews: PreviewProvider{
    static var previews: some View{
        NavigationStack{
            SettingsView(showSignInView: .constant(false))
        }
    }
}

extension SettingsView{
    
    private var emailSection: some View{
        Section{
            
            Button("Reset Password"){
                Task{
                    do{
                        try await viewModel.resetPassword()
                        print("PASSWORD RESET!")
                    } catch {
                        print(error)
                    }
                }
            }
            
            Button("Update Password"){
                Task{
                    do{
                        try await viewModel.updatePassword()
                        print("PASSWORD UPDATED!")
                    } catch {
                        print(error)
                    }
                }
            }
            
            Button("Update Email"){
                Task{
                    do{
                        try await viewModel.updateEmail()
                        print("EMAIL UPDATED!")
                    } catch {
                        print(error)
                    }
                }
            }
        } header: {
            Text("Email functions")
        }
        
    }
}
