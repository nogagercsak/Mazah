//
//  ScannerView.swift
//  Mazah
//
//  Created by Noga Gercsak on 6/26/24.
//

import SwiftUI

struct ScannerView: View {
    
    @Binding var showSignInView: Bool
    var userId = UUID().uuidString
    
    var body: some View {
        BarcodeCaptureViewControllerRepresentable(userId: userId)
            .edgesIgnoringSafeArea(.all)
        NavBar(showSignInView: $showSignInView)
    }
}
