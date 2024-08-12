//
//  SignUpEmailView.swift
//  Mazah
//
//  Created by Noga Gercsak on 6/1/24.
//

import SwiftUI


struct SignUpEmailView: View {
    
    @StateObject private var viewModel = SignInEmailViewModel()
    @Binding var showSignInView: Bool
    @State private var agreedToTerms: Bool = false
    @State private var showingTerms = false
    
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
            
            HStack {
                CheckboxView(isChecked: $agreedToTerms, checkedColor: Color(hex: "#576956"))
                            
                 Button(action: {showingTerms = true
                            }) {
                    Text("I agree to the ")
                        .font(Font.custom("Poppins-Regular", size: 18))
                        .foregroundColor(Color(red: 0.40, green: 0.40, blue: 0.40)) +
                    Text("Terms and Conditions")
                         .underline()
                         .font(Font.custom("Poppins-Regular", size: 18))
                         .foregroundColor(.blue)
                            }
                            .sheet(isPresented: $showingTerms) {
                                TermsAndConditionsView()
                            }
                        }
                        .padding(.horizontal)
                        .padding(.top, 15)
            
            Button{
                Task{
                    if !agreedToTerms {
                        print("User must agree to the terms and conditions.")
                        return
                    }
                    
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
                Text("Sign Up")
                    .font(Font.custom("Poppins-Regular", size: 24))
                    .foregroundColor(.white)
                    .frame(width: 233, height: 54, alignment: .center)
                    .background(Color(red: 0.43, green: 0.51, blue: 0.42))
                    .cornerRadius(10)
                    .padding(.top, 40)
    
            }
            .disabled(!agreedToTerms)
            
            Spacer()
        }
        .background(Color(red: 1, green: 0.96, blue: 0.89))
        .navigationTitle("Sign Up With Email")
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

struct SignUpWithEmail: PreviewProvider{
    static var previews: some View{
        NavigationStack{
            SignUpEmailView(showSignInView: .constant(false))
        }
    }
}

struct CheckboxView: View {
    @Binding var isChecked: Bool
    var checkedColor: Color

    var body: some View {
        Button(action: {
            isChecked.toggle()
        }) {
            Image(systemName: isChecked ? "checkmark.square" : "square")
                .resizable()
                .frame(width: 24, height: 24)
                .foregroundColor(isChecked ? checkedColor : .gray)
        }
        .buttonStyle(PlainButtonStyle())
    }
}
