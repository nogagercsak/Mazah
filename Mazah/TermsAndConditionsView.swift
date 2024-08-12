//
//  TermsAndConditionsView.swift
//  Mazah
//
//  Created by Gabrielle on 12.08.2024.
//

import Foundation
import SwiftUI

struct TermsAndConditionsView: View {
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Terms and Conditions")
                        .font(Font.custom("Poppins-Regular", size: 24))
                        .padding(.bottom, 20)
                    
                    Text("Here are the terms and conditions...")
                        .font(Font.custom("Poppins-Regular", size: 18))
                }
                .padding()
            }
            .navigationTitle("Terms and Conditions")
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarItems(trailing: Button("Close") {
                presentationMode.wrappedValue.dismiss()
            })
        }
    }
}

struct TermsAndConditionsView_Previews: PreviewProvider {
    static var previews: some View {
        TermsAndConditionsView()
    }
}
