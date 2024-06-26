//
//  ScannerView.swift
//  Mazah
//
//  Created by Noga Gercsak on 6/26/24.
//

import SwiftUI

struct ScannerView: View {
    
    @Binding var showSignInView: Bool
    
    var body: some View {
        BarcodeCaptureViewControllerRepresentable()
            .edgesIgnoringSafeArea(.all)
        NavBar(showSignInView: $showSignInView)
    }
}
