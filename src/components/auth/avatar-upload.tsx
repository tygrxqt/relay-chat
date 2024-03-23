/* eslint-disable @next/next/no-img-element */
// Disabled eslint for img element because images are loaded from local storage, not from the web.
import * as React from "react";

import { useMediaQuery } from "@/hooks/use-media-query";
import { Button, ButtonProps } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import ReactCrop, { Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import { useAuth } from "@/providers/auth";
import { toast } from "sonner";

const MAX_FILE_SIZE = 12582912; // 12 MB

export default function AvatarUpload(props: ButtonProps) {
	const [open, setOpen] = React.useState(false);
	const isDesktop = useMediaQuery("(min-width: 768px)");
	const { user, uploadAvatar } = useAuth();

	const [src, setSrc] = React.useState("");
	const [completedCrop, setCompletedCrop] = React.useState<Crop | null>(null);

	const imageInputRef = React.useRef<HTMLInputElement>(null);
	const imageRef = React.useRef<HTMLImageElement>(null);

	const randomUUID = React.useId();

	const [crop, setCrop] = React.useState<Crop>({
		unit: "%",
		width: 50,
		height: 50,
		x: 0,
		y: 0,
	});

	function resetCrop() {
		setSrc("");
		setCrop({
			unit: "%",
			width: 50,
			height: 50,
			x: 0,
			y: 0,
		});
		imageInputRef.current?.value && (imageInputRef.current.value = "");
	}

	function onOpenChange() {
		setOpen(!open);
		// wait 1 second for the drawer to close
		setTimeout(() => resetCrop(), 1000);
	}

	function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
		const { naturalWidth: width, naturalHeight: height } = e.currentTarget;

		const crop = centerCrop(
			makeAspectCrop(
				{
					// You don't need to pass a complete crop into
					// makeAspectCrop or centerCrop.
					unit: "%",
					width: 90,
				},
				1 / 1,
				width,
				height
			),
			width,
			height
		);

		setCrop(crop);
	}

	function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
		if (e.target.files && e.target.files.length > 0) {
			if (e.target.files[0].size > MAX_FILE_SIZE) {
				resetCrop();
				return toast.error("Images must be under 12 MB.");
			}
			const reader = new FileReader();
			reader.addEventListener("load", () =>
				setSrc(reader.result?.toString() || "")
			);
			reader.readAsDataURL(e.target.files[0]);

			const image = new Image();
			const type = e.target.files[0].type;
			image.src = URL.createObjectURL(e.target.files[0]);
			image.onload = () => {
				if (image.width < 256 || image.height < 256) {
					resetCrop();
					return toast.error(
						"Please use an image that is at least 256x256 pixels."
					);
				}
				if (
					!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(type)
				) {
					resetCrop();
					return toast.error(
						"Images must be in either JPEG, PNG, GIF, or WEBP format."
					);
				} else {
					setOpen(true);
				}
			};
		}
	}

	function onSubmitCrop() {
		if (completedCrop) {
			// create a canvas element to draw the cropped image
			const canvas = document.createElement("canvas");

			// get the image element
			const image = imageRef.current;

			// draw the image on the canvas
			if (image) {
				const crop = completedCrop;
				const scaleX = image.naturalWidth / image.width;
				const scaleY = image.naturalHeight / image.height;
				const ctx = canvas.getContext("2d");
				const pixelRatio = window.devicePixelRatio;
				canvas.width = crop.width * pixelRatio * scaleX;
				canvas.height = crop.height * pixelRatio * scaleY;

				if (ctx) {
					ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
					ctx.imageSmoothingQuality = "high";

					ctx.drawImage(
						image,
						crop.x * scaleX,
						crop.y * scaleY,
						crop.width * scaleX,
						crop.height * scaleY,
						0,
						0,
						crop.width * scaleX,
						crop.height * scaleY
					);
				}

				const base64Image = canvas.toDataURL("image/png"); // can be changed to jpeg/jpg etc

				if (base64Image) {
					const fileType = base64Image.split(";")[0].split(":")[1];

					const buffer = Buffer.from(
						base64Image.replace(/^data:image\/\w+;base64,/, ""),
						"base64"
					);
					const file = new File([buffer], user?.username ?? randomUUID, {
						type: fileType,
					});
					uploadAvatar(file);
				}

				onOpenChange();
			}
		}
	}

	if (isDesktop) {
		return (
			<>
				<Button onClick={() => imageInputRef.current?.click()} {...props} />
				<input
					ref={imageInputRef}
					type="file"
					accept="image/jpeg, image/png, image/gif, image/webp"
					className="hidden"
					onChange={onSelectFile}
				/>
				<Dialog open={open} onOpenChange={onOpenChange}>
					<DialogContent className="gap-0 p-0 w-fit">
						<ReactCrop
							crop={crop}
							onChange={(_, p) => setCrop(p)}
							onComplete={(c, _) => setCompletedCrop(c)}
							aspect={1 / 1}
							minHeight={100}
							circularCrop
							keepSelection
						>
							<img
								alt="Cropper"
								src={src}
								onLoad={onImageLoad}
								ref={imageRef}
								className="rounded-t-lg"
							/>
						</ReactCrop>
						<div className="flex flex-row justify-between w-full gap-2 p-4 border-t">
							<Button variant="outline" onClick={onOpenChange}>
								Cancel
							</Button>
							<Button onClick={onSubmitCrop}>Save</Button>
						</div>
					</DialogContent>
				</Dialog>
			</>
		);
	}

	return (
		<>
			<Button onClick={() => imageInputRef.current?.click()} {...props} />
			<input
				ref={imageInputRef}
				type="file"
				accept="image/jpeg, image/png, image/gif, image/webp"
				className="hidden"
				onChange={onSelectFile}
			/>
			<Drawer open={open} dismissible={false}>
				<DrawerContent handle={false}>
					<ReactCrop
						crop={crop}
						onChange={(_, p) => setCrop(p)}
						onComplete={(c, _) => setCompletedCrop(c)}
						aspect={1 / 1}
						minHeight={256}
						circularCrop
						keepSelection
					>
						<img
							alt="Cropper"
							src={src}
							onLoad={onImageLoad}
							ref={imageRef}
							className="rounded-t-lg"
						/>
					</ReactCrop>
					<div className="flex flex-row justify-between w-full gap-2 p-4 border-t">
						<Button variant="outline" onClick={onOpenChange}>
							Cancel
						</Button>
						<Button onClick={onSubmitCrop}>Save</Button>
					</div>
				</DrawerContent>
			</Drawer>
		</>
	);
}
