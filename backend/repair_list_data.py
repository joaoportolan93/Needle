"""
Repair script for broken album references in list_items.
Fixes two problems:
1. ListItems pointing to OLD spotify_ids (refresh_covers.py changed them but forgot list_items)
2. Placeholder "Álbum Desconhecido" albums that should be real albums

Run: python repair_list_data.py
"""
import asyncio
from database import SessionLocal
import models
from seeds import SEED_ALBUMS
from spotify_service import spotify_service


async def repair():
    db = SessionLocal()
    try:
        # === Step 1: Build mapping of OLD ID -> NEW ID using SEED_ALBUMS ===
        # SEED_ALBUMS has the original IDs. The 'albums' table may have updated IDs
        # for the same album name (refresh_covers.py changed them).
        seed_name_to_old_id = {a["name"]: a["spotify_id"] for a in SEED_ALBUMS}

        # Build name -> current_id from the albums table
        all_albums = db.query(models.Album).all()
        name_to_current_id = {}
        for album in all_albums:
            if album.name != "Álbum Desconhecido":
                name_to_current_id[album.name] = album.spotify_id

        # Build old_id -> new_id mapping
        old_to_new = {}
        for name, old_id in seed_name_to_old_id.items():
            current_id = name_to_current_id.get(name)
            if current_id and current_id != old_id:
                old_to_new[old_id] = current_id

        print(f"Found {len(old_to_new)} ID migrations from refresh_covers.py:")
        for old, new in old_to_new.items():
            print(f"  {old[:12]}... -> {new[:12]}...")

        # === Step 2: Fix ListItems that point to old IDs ===
        fixed_refs = 0
        for old_id, new_id in old_to_new.items():
            count = db.query(models.ListItem).filter(
                models.ListItem.album_spotify_id == old_id
            ).update({"album_spotify_id": new_id})
            if count > 0:
                print(f"  Updated {count} list items: {old_id[:12]}... -> {new_id[:12]}...")
                fixed_refs += count
        db.commit()
        print(f"Fixed {fixed_refs} list item references.\n")

        # === Step 3: Fix remaining "Álbum Desconhecido" entries ===
        # These are items that couldn't be matched by seed data.
        # Try fetching from Spotify by the spotify_id on the ListItem.
        unknown_albums = db.query(models.Album).filter(
            models.Album.name == "Álbum Desconhecido"
        ).all()
        print(f"Found {len(unknown_albums)} placeholder albums to fix.")

        fixed_unknowns = 0
        for album in unknown_albums:
            try:
                spotify_data = await spotify_service.get_album(album.spotify_id)

                cover_url = None
                if spotify_data.get("images") and len(spotify_data["images"]) > 0:
                    cover_url = spotify_data["images"][0].get("url")

                artist_name = "Artista Desconhecido"
                if spotify_data.get("artists") and len(spotify_data["artists"]) > 0:
                    artist_name = spotify_data["artists"][0].get("name", artist_name)

                album.name = spotify_data.get("name", album.name)
                album.artist_name = artist_name
                album.cover_url = cover_url
                album.release_date = spotify_data.get("release_date")
                db.commit()
                print(f"  FIXED: {album.name} ({album.spotify_id[:12]}...)")
                fixed_unknowns += 1
            except Exception as e:
                # Spotify 404 — this ID is truly dead.
                # Check if this album name exists under a different ID via search
                print(f"  STILL UNKNOWN: {album.spotify_id[:12]}... ({e})")

                # Try search as last resort
                try:
                    # Use the list item's position in seed data to find the name
                    seed_name = None
                    for sa in SEED_ALBUMS:
                        if sa["spotify_id"] == album.spotify_id:
                            seed_name = sa["name"]
                            break

                    if seed_name and seed_name in name_to_current_id:
                        # We already have this album under a new ID!
                        new_id = name_to_current_id[seed_name]
                        # Update all list items pointing to the dead ID
                        count = db.query(models.ListItem).filter(
                            models.ListItem.album_spotify_id == album.spotify_id
                        ).update({"album_spotify_id": new_id})
                        # Delete the placeholder
                        db.delete(album)
                        db.commit()
                        print(f"    -> Redirected {count} items to existing album '{seed_name}' ({new_id[:12]}...)")
                        fixed_unknowns += 1
                except Exception as inner_e:
                    print(f"    -> Could not fix: {inner_e}")

        print(f"\nFixed {fixed_unknowns} placeholder albums.")

        # === Step 4: Clean up orphan "Álbum Desconhecido" albums with no references ===
        remaining_unknowns = db.query(models.Album).filter(
            models.Album.name == "Álbum Desconhecido"
        ).all()
        cleaned = 0
        for album in remaining_unknowns:
            refs = db.query(models.ListItem).filter(
                models.ListItem.album_spotify_id == album.spotify_id
            ).count()
            review_refs = db.query(models.Review).filter(
                models.Review.album_spotify_id == album.spotify_id
            ).count()
            if refs == 0 and review_refs == 0:
                db.delete(album)
                cleaned += 1
        db.commit()
        print(f"Cleaned up {cleaned} orphan placeholder albums.\n")

        # === Final report ===
        still_unknown = db.query(models.ListItem).join(models.Album).filter(
            models.Album.name == "Álbum Desconhecido"
        ).count()
        no_cover = db.query(models.ListItem).join(models.Album).filter(
            models.Album.cover_url == None
        ).count()
        print(f"=== FINAL STATUS ===")
        print(f"List items still pointing to 'Unknown' albums: {still_unknown}")
        print(f"List items with albums missing cover URL: {no_cover}")

    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(repair())
