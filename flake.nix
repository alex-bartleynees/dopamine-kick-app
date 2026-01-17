{
  description = "Dopamine Kick App development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        # Helper to create landrun-wrapped version of a package
        wrapWithLandrun = { pkg, binName, extraArgs ? "" }:
          pkgs.writeShellScriptBin binName ''
            exec ${pkgs.landrun}/bin/landrun \
              --rox /nix/store \
              --rwx "$PWD" \
              --ro /etc \
              --ro /run/current-system \
              ${extraArgs} \
              ${pkg}/bin/${binName} "$@"
          '';

        # Sandboxed versions of development tools
        sandboxed-node = pkgs.writeShellScriptBin "node" ''
          exec ${pkgs.landrun}/bin/landrun \
            --rox /nix/store \
            --rwx "$PWD" \
            --ro /etc \
            --ro /run/current-system \
            --rw /tmp \
            --unrestricted-network \
            ${pkgs.nodejs_24}/bin/node "$@"
        '';

        sandboxed-pnpm = wrapWithLandrun {
          pkg = pkgs.pnpm;
          binName = "pnpm";
          extraArgs = "--rw ~/.pnpm-store --connect-tcp 443 --connect-tcp 80";
        };

        sandboxed-bun = wrapWithLandrun {
          pkg = pkgs.bun;
          binName = "bun";
          extraArgs = "--rw ~/.bun --connect-tcp 443 --connect-tcp 80";
        };

        sandboxed-biome = wrapWithLandrun {
          pkg = pkgs.biome;
          binName = "biome";
          extraArgs = ""; # No network flags = network blocked
        };

        sandboxed-tsc = wrapWithLandrun {
          pkg = pkgs.nodePackages.typescript;
          binName = "tsc";
          extraArgs = ""; # No network flags = network blocked
        };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            landrun
            # Sandboxed tools
            sandboxed-node
            sandboxed-pnpm
            sandboxed-bun
            sandboxed-biome
            sandboxed-tsc
            nodePackages.typescript-language-server
          ];

          shellHook = ''
            # Create cache directories if they don't exist (landrun requires them)
            mkdir -p ~/.pnpm-store
            mkdir -p ~/.bun

            echo "🧠 Dopamine Kick App dev environment (sandboxed)"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "📁 Project: $PWD"
            echo "🟢 Node: $(node --version)"
            echo "📦 pnpm: $(pnpm --version)"
            echo "🍞 bun: $(bun --version)"
            echo ""
            echo "🔒 Landrun sandboxing active:"
            echo "   ✓ Read/write/exec: \$PWD"
            echo "   ✓ Read/exec: /nix/store"
            echo "   ✓ Network: restricted by tool"
            echo ""
            echo "💡 Network restrictions:"
            echo "   • pnpm/bun: HTTPS/HTTP only (ports 443/80)"
            echo "   • node: unrestricted (for dev server)"
            echo "   • biome/tsc: network blocked"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
          '';
        };
      }
    );
}
