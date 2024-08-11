//
//  SIgnInEmailView.swift
//  Mazah
//
//  Created by Noga Gercsak on 6/1/24.
//

import SwiftUI


struct SignInEmailView: View {
    
    @StateObject private var viewModel = SignInEmailViewModel()
    @Binding var showSignInView: Bool
    
    var body: some View {
        VStack{
            TextField("Email...", text: $viewModel.email)
                .padding(.horizontal)
                .padding(.vertical, 10)
                .background(Color.gray.opacity(0.3))
                .cornerRadius(10)
                .padding(.horizontal)
                .padding(.horizontal)
                .padding(.horizontal)
                .padding(.top, 100)
            
            SecureField("Password...", text: $viewModel.password)
                .padding(.horizontal)
                .padding(.vertical, 10)
                .background(Color.gray.opacity(0.3))
                .cornerRadius(10)
                .padding(.horizontal)
                .padding(.horizontal)
                .padding(.horizontal)
                .padding(.top, 5)
            
            Button{
                Task{
                    do{
                        try await viewModel.signUp()
                        showSignInView =  false
                        return
                    } catch {
                        print(error)
                    }
                    
                    do{
                        try await viewModel.signIn()
                        showSignInView =  false
                        return
                    } catch {
                        print(error)
                    }
                }
            } label: {
                Text("Sign In")
                    .font(Font.custom("Poppins-Regular", size: 24))
                    .foregroundColor(.white)
                    .frame(width: 233, height: 54, alignment: .center)
                    .background(Color(red: 0.43, green: 0.51, blue: 0.42))
                    .cornerRadius(10)
                    .padding(.top, 40)
            }
            Spacer()
        }
        .background(Color(red: 1, green: 0.96, blue: 0.89))
        .navigationTitle("Sign In With Email")
        .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .principal) {
                        Text("Mazah")
                            .font(Font.custom("Poppins-Regular", size: 70))
                            .foregroundColor(Color(red: 0.34, green: 0.41, blue: 0.34))
                            .padding(.top, 100)
                    }
                }
            }
        }

struct SignInWithEmail: PreviewProvider{
    static var previews: some View{
        NavigationStack{
            SignInEmailView(showSignInView: .constant(false))
        }
    }
}

